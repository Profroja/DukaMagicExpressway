import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { API_URL, ApiError } from "@/lib/api";

/**
 * Staff mode. SokoLink staff sign in from the person icon in the header; the
 * app then shows the orders of their city and alerts them to new ones. They
 * call the customer and process the order on the website.
 */

export type StaffUser = { name: string; phone: string; role: string; city: string };
export type StaffSession = { token: string; user: StaffUser };

export type StaffOrderStatus =
  | "new"
  | "contacted"
  | "confirmed"
  | "sourcing"
  | "picked_up"
  | "delivered"
  | "closed"
  | "cancelled";

export type StaffOrder = {
  id: string;
  created_at: string | null;
  status: StaffOrderStatus;
  product_title: string;
  product_image: string;
  listing_type: "product" | "service";
  quantity: number;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  latitude: string | null;
  longitude: string | null;
  distance_km: string | null;
  total: string;
  delivery_fee: string;
  grand_total: string;
  currency: string;
  city: string;
};

const SESSION_KEY = "duka-staff-session";
const SEEN_KEY = "duka-staff-seen-orders";

export class SessionExpired extends Error {}

async function staffRequest<T>(path: string, token?: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : null,
    });
  } catch {
    throw new ApiError("network");
  }
  const data = await response.json().catch(() => null);
  if (response.status === 401 && token) throw new SessionExpired();
  if (!response.ok) throw new ApiError(data?.error || `HTTP ${response.status}`);
  return data as T;
}

export async function loadSession(): Promise<StaffSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StaffSession) : null;
  } catch {
    return null;
  }
}

export async function fetchStaffOrders(token: string) {
  return staffRequest<{ user: StaffUser; orders: StaffOrder[] }>("/api/staff/orders/", token);
}

export type StaffWorkRow = {
  id: string;
  product_title: string;
  listing_type: "product" | "service";
  quantity: number;
  customer_name: string;
  customer_phone: string;
  city: string;
  status: StaffOrderStatus;
  status_label: string;
  grand_total: string;
  amount_paid: string | null;
  created_at: string | null;
  closed_at: string | null;
  closed_by: string;
  currency: string;
};

/** Orders received and closed, and money collected, in a date range. */
export type StaffWork = {
  range: { from: string; to: string };
  today: { date: string; received: number; closed: number; collected: string };
  totals: {
    received: number;
    closed: number;
    collected: string;
    average: string;
    delivered: number;
    cancelled: number;
  };
  open: Partial<Record<StaffOrderStatus, number>>;
  daily: { date: string; received: number; closed: number; collected: string }[];
  closed_orders: StaffWorkRow[];
  received_orders: StaffWorkRow[];
};

/** from / to are YYYY-MM-DD days. */
export async function fetchStaffWork(token: string, from: string, to: string) {
  return staffRequest<StaffWork>(`/api/staff/performance/?from=${from}&to=${to}`, token);
}

/**
 * Orders not seen before. The first check after signing in only remembers
 * what is already there, so staff aren't flooded with old orders.
 */
export async function takeNewOrders(orders: StaffOrder[]): Promise<StaffOrder[]> {
  const raw = await AsyncStorage.getItem(SEEN_KEY).catch(() => null);
  const ids = orders.map((o) => o.id);
  if (raw === null) {
    await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(ids)).catch(() => {});
    return [];
  }
  const seen = new Set<string>(JSON.parse(raw));
  const fresh = orders.filter((o) => !seen.has(o.id));
  if (fresh.length) {
    await AsyncStorage.setItem(SEEN_KEY, JSON.stringify([...seen, ...ids].slice(-300))).catch(() => {});
  }
  return fresh;
}

type StaffContextValue = {
  /** null while loading from storage. */
  session: StaffSession | null | undefined;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  orders: StaffOrder[];
  setOrders: (orders: StaffOrder[]) => void;
};

const StaffContext = createContext<StaffContextValue | null>(null);

export function StaffProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StaffSession | null | undefined>(undefined);
  const [orders, setOrders] = useState<StaffOrder[]>([]);

  useEffect(() => {
    loadSession().then(setSession);
  }, []);

  const signIn = async (username: string, password: string) => {
    const data = await staffRequest<StaffSession>("/api/staff/login/", undefined, { username, password });
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data));
    await AsyncStorage.removeItem(SEEN_KEY).catch(() => {});
    setSession(data);
  };

  const signOut = async () => {
    await AsyncStorage.multiRemove([SESSION_KEY, SEEN_KEY]).catch(() => {});
    setOrders([]);
    setSession(null);
  };

  return (
    <StaffContext.Provider value={{ session, signIn, signOut, orders, setOrders }}>
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const value = useContext(StaffContext);
  if (!value) throw new Error("useStaff must be used inside StaffProvider");
  return value;
}
