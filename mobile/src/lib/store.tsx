import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { fetchOrderStatus, type Listing, type OrderStatus } from "@/lib/api";
import { notifyStatusChange } from "@/lib/notifications";
import { loadOrders, saveOrderRow, updateOrderStatus } from "@/lib/ordersDb";

/** Saved like the website's "My Orders" - on this device, keyed by order id. */
export type CustomerOrder = {
  id: string;
  listingId: string;
  title: string;
  imageUrl: string;
  listingType: "product" | "service";
  quantity: number;
  /** What the customer pays, including delivery. */
  total: number;
  /** Delivery fee included in total (0 for services / no fee). */
  deliveryFee?: number;
  currency: string;
  phone: string;
  status: OrderStatus;
  createdAt: string;
};

export type CartItem = {
  id: string;
  title: string;
  image_url: string;
  price: string | number;
  currency: string;
  listing_type: "product" | "service";
  quantity: number;
  listing: Listing;
};

const CART_KEY = "duka-cart";

export function isActiveOrder(status: OrderStatus) {
  return status !== "delivered" && status !== "cancelled";
}

type StoreValue = {
  ready: boolean;
  orders: CustomerOrder[];
  saveOrder: (order: CustomerOrder) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  refreshOrders: () => Promise<void>;
  cart: CartItem[];
  cartCount: number;
  addToCart: (listing: Listing, quantity?: number) => void;
  setCartQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  // Latest orders for callbacks (status polling) - kept in step with every write.
  const ordersRef = useRef<CustomerOrder[]>([]);

  useEffect(() => {
    Promise.all([loadOrders().catch(() => [] as CustomerOrder[]), AsyncStorage.getItem(CART_KEY)])
      .then(([savedOrders, savedCart]) => {
        ordersRef.current = savedOrders;
        setOrders(savedOrders);
        try {
          const c = JSON.parse(savedCart || "[]");
          if (Array.isArray(c)) setCart(c);
        } catch {}
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // In-memory list for the UI; every change is also written to SQLite.
  const setOrderList = useCallback((next: CustomerOrder[]) => {
    ordersRef.current = next;
    setOrders(next);
  }, []);

  const persistCart = useCallback((next: CartItem[]) => {
    setCart(next);
    AsyncStorage.setItem(CART_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const saveOrder = useCallback(
    (order: CustomerOrder) => {
      const rest = ordersRef.current.filter((o) => o.id !== order.id);
      setOrderList([order, ...rest]);
      saveOrderRow(order).catch(() => {});
    },
    [setOrderList],
  );

  const setOrderStatus = useCallback(
    (id: string, status: OrderStatus) => {
      const current = ordersRef.current;
      if (!current.some((o) => o.id === id && o.status !== status)) return;
      setOrderList(current.map((o) => (o.id === id ? { ...o, status } : o)));
      updateOrderStatus(id, status).catch(() => {});
      const order = current.find((o) => o.id === id);
      if (order) notifyStatusChange(order, status).catch(() => {});
    },
    [setOrderList],
  );

  /** Ask the backend for the latest status of every ongoing order. */
  const refreshOrders = useCallback(async () => {
    const active = ordersRef.current.filter((o) => isActiveOrder(o.status));
    const results = await Promise.all(
      active.map(async (o) => {
        try {
          const { status } = await fetchOrderStatus(o.id);
          return [o.id, status] as const;
        } catch {
          return null; // keep the last known status while offline
        }
      }),
    );
    const updates = new Map(results.filter((r): r is readonly [string, OrderStatus] => !!r));
    const changed = [...updates].filter(([id, status]) =>
      ordersRef.current.some((o) => o.id === id && o.status !== status),
    );
    if (!changed.length) return;
    const before = ordersRef.current;
    setOrderList(
      before.map((o) => (updates.has(o.id) ? { ...o, status: updates.get(o.id)! } : o)),
    );
    for (const [id, status] of changed) {
      updateOrderStatus(id, status).catch(() => {});
      const order = before.find((o) => o.id === id);
      if (order) notifyStatusChange(order, status).catch(() => {});
    }
  }, [setOrderList]);

  // While the app is open, check ongoing orders every 30s so alerts pop up
  // on any screen (the background task covers the app being closed).
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => {
      refreshOrders().catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, [ready, refreshOrders]);

  const addToCart = useCallback(
    (listing: Listing, quantity = 1) => {
      const existing = cart.find((item) => item.id === listing.id);
      persistCart(
        existing
          ? cart.map((item) =>
              item.id === listing.id ? { ...item, quantity: item.quantity + quantity } : item,
            )
          : [
              ...cart,
              {
                id: listing.id,
                title: listing.title,
                image_url: listing.image_url,
                price: listing.price,
                currency: listing.currency,
                listing_type: listing.listing_type,
                quantity,
                listing,
              },
            ],
      );
    },
    [cart, persistCart],
  );

  const removeFromCart = useCallback(
    (id: string) => persistCart(cart.filter((item) => item.id !== id)),
    [cart, persistCart],
  );

  const setCartQuantity = useCallback(
    (id: string, quantity: number) => {
      if (quantity < 1) return removeFromCart(id);
      persistCart(cart.map((item) => (item.id === id ? { ...item, quantity } : item)));
    },
    [cart, persistCart, removeFromCart],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      orders,
      saveOrder,
      setOrderStatus,
      refreshOrders,
      cart,
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      addToCart,
      setCartQuantity,
      removeFromCart,
    }),
    [ready, orders, saveOrder, setOrderStatus, refreshOrders, cart, addToCart, setCartQuantity, removeFromCart],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}
