import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * The Django backend - the same API the website uses.
 *
 * Set EXPO_PUBLIC_API_URL (e.g. in mobile/.env) to point at a server, for
 * example https://api.example.com. When it is not set during development, the
 * app talks to port 8000 on the computer running `npx expo start`, so a phone
 * on the same Wi-Fi reaches your local backend.
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.20:8081"
  const host = hostUri?.split(":")[0];
  if (host && host !== "localhost" && host !== "127.0.0.1") return `http://${host}:8000`;

  // Android emulators reach the host computer at 10.0.2.2.
  return Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";
}

export const API_URL = resolveApiUrl();

export type ListingType = "product" | "service";

export type Listing = {
  id: string;
  title: string;
  price: string | number;
  currency: string;
  available?: boolean;
  image_url: string;
  category?: string;
  subcategory?: string;
  listing_type: ListingType;
  store?: string;
  description?: string;
  discount?: number | null;
  sale?: string | null;
  created_at?: string | null;
};

/** Customer-facing order statuses (the backend reports "closed" as "delivered"). */
export type OrderStatus =
  | "new"
  | "contacted"
  | "confirmed"
  | "sourcing"
  | "picked_up"
  | "delivered"
  | "cancelled";

export class ApiError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    });
  } catch {
    throw new ApiError("network");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(data?.error || `HTTP ${response.status}`);
  return data as T;
}

/** Absolute URL for an image path from the API ("media/products/x.jpg"). */
export function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_URL}/${path.replace(/^\/+/, "")}`;
}

// Listings seen so far, so a product screen opens instantly from a list.
const listingCache = new Map<string, Listing>();

export function getCachedListing(id: string) {
  return listingCache.get(id);
}

export async function fetchCatalog(
  filters: { category?: string; type?: ListingType } = {},
): Promise<{ products: Listing[]; services: Listing[] }> {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.type) params.set("type", filters.type);
  const query = params.toString();
  const data = await request<{ products?: Listing[]; services?: Listing[] }>(
    `/api/catalog/${query ? `?${query}` : ""}`,
  );
  const products = data.products ?? [];
  const services = data.services ?? [];
  for (const item of [...products, ...services]) listingCache.set(item.id, item);
  return { products, services };
}

/** One listing by id - from the cache, else from the full catalog. */
export async function fetchListing(id: string): Promise<Listing | undefined> {
  const cached = listingCache.get(id);
  if (cached) return cached;
  const [products, services] = await Promise.all([
    fetchCatalog({ type: "product" }),
    fetchCatalog({ type: "service" }),
  ]);
  return [...products.products, ...services.services].find((item) => item.id === id);
}

export type DeliveryQuote = {
  configured: boolean;
  deliverable: boolean;
  distance_km: string | null;
  fee: string | null;
  max_km: string | null;
};

/** Delivery fee from our main store to this point (priced by km ranges). */
export async function fetchDeliveryQuote(latitude: number, longitude: number): Promise<DeliveryQuote> {
  return request(`/api/delivery/quote/?lat=${latitude}&lng=${longitude}`);
}

export async function placeOrder(input: {
  listingId: string;
  quantity: number;
  name: string;
  phone: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  /** "Nimeshalipia": paid ahead to this lipa number. */
  payment?: { accountId: string; reference: string } | null;
}): Promise<{ order_id: string; total: string; delivery_fee: string; grand_total: string; currency: string }> {
  return request("/api/orders/quick/", {
    method: "POST",
    body: JSON.stringify({
      listing_id: input.listingId,
      quantity: input.quantity,
      name: input.name,
      phone: input.phone,
      address: input.address,
      latitude: input.latitude != null ? input.latitude.toFixed(6) : null,
      longitude: input.longitude != null ? input.longitude.toFixed(6) : null,
      payment: input.payment
        ? { paid: true, account_id: input.payment.accountId, reference: input.payment.reference }
        : null,
    }),
  });
}

/** A lipa number customers pay to before sending an order (set by admins on the website). */
export type PaymentAccount = {
  id: string;
  provider: string;
  provider_label: string;
  number: string;
  account_name: string;
  note: string;
};

export async function fetchPaymentAccounts(): Promise<PaymentAccount[]> {
  const data = await request<{ accounts: PaymentAccount[] }>("/api/payment-accounts/");
  return data.accounts ?? [];
}

export async function fetchOrderStatus(orderId: string): Promise<{ status: OrderStatus }> {
  return request(`/api/orders/quick/${orderId}/`);
}

/** Customers can cancel only while the order is new or being confirmed. */
export async function cancelOrder(orderId: string): Promise<{ status: OrderStatus }> {
  return request(`/api/orders/quick/${orderId}/`, {
    method: "POST",
    body: JSON.stringify({ status: "cancelled" }),
  });
}

export type CategoryOption = { name: string; count: number };
export type CategoryLists = { goods: CategoryOption[]; services: CategoryOption[] };

/** Every goods and service category (built-in + ones stores added); count = listings now. */
export async function fetchCategories(): Promise<CategoryLists> {
  const data = await request<Partial<CategoryLists>>("/api/categories/");
  return { goods: data.goods ?? [], services: data.services ?? [] };
}

let searchIndex: Promise<Listing[]> | null = null;

/** Every product and service once (cached for live search), de-duplicated by id. */
export function loadSearchIndex(fresh = false): Promise<Listing[]> {
  if (!searchIndex || fresh) {
    searchIndex = Promise.all([fetchCatalog({ type: "product" }), fetchCatalog({ type: "service" })])
      .then(([products, services]) => {
        const unique = new Map<string, Listing>();
        for (const item of [...products.products, ...products.services, ...services.services]) {
          unique.set(item.id, item);
        }
        return [...unique.values()];
      })
      .catch((error) => {
        searchIndex = null;
        throw error;
      });
  }
  return searchIndex;
}

/** Items whose title, description, category or store contain every word typed. */
export function matchListings(items: Listing[], query: string): Listing[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return items.filter((item) => {
    const haystack = [item.title, item.description, item.category, item.subcategory, item.store]
      .join(" ")
      .toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

/** Open the order form straight away (services: the booking form). */
export const orderHref = (id: string) => ({ pathname: "/listing/[id]" as const, params: { id, step: "contact" as const } });
