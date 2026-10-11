import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SQLite from "expo-sqlite";

import type { OrderStatus } from "@/lib/api";
import type { CustomerOrder } from "@/lib/store";

/** Order history kept in an on-device SQLite database (duka.db). */
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const LEGACY_KEY = "duka-orders"; // orders saved by the first app version

async function db() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const database = await SQLite.openDatabaseAsync("duka.db");
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY NOT NULL,
          listing_id TEXT NOT NULL,
          title TEXT NOT NULL,
          image_url TEXT NOT NULL DEFAULT '',
          listing_type TEXT NOT NULL DEFAULT 'product',
          quantity INTEGER NOT NULL DEFAULT 1,
          total REAL NOT NULL DEFAULT 0,
          currency TEXT NOT NULL DEFAULT 'TZS',
          phone TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'new',
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS orders_created ON orders (created_at DESC);
      `);
      await migrateLegacy(database);
      return database;
    })();
  }
  return dbPromise;
}

async function insert(database: SQLite.SQLiteDatabase, o: CustomerOrder) {
  await database.runAsync(
    `INSERT OR REPLACE INTO orders
       (id, listing_id, title, image_url, listing_type, quantity, total, currency, phone, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    o.id, o.listingId, o.title, o.imageUrl ?? "", o.listingType ?? "product",
    o.quantity, o.total, o.currency, o.phone, o.status, o.createdAt,
  );
}

/** Copy orders from the old key-value storage once, then drop it. */
async function migrateLegacy(database: SQLite.SQLiteDatabase) {
  try {
    const raw = await AsyncStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const legacy = JSON.parse(raw);
    if (Array.isArray(legacy)) for (const o of legacy) await insert(database, o);
    await AsyncStorage.removeItem(LEGACY_KEY);
  } catch {}
}

type Row = {
  id: string; listing_id: string; title: string; image_url: string; listing_type: string;
  quantity: number; total: number; currency: string; phone: string; status: string; created_at: string;
};

export async function loadOrders(): Promise<CustomerOrder[]> {
  const rows = await (await db()).getAllAsync<Row>("SELECT * FROM orders ORDER BY created_at DESC");
  return rows.map((r) => ({
    id: r.id,
    listingId: r.listing_id,
    title: r.title,
    imageUrl: r.image_url,
    listingType: r.listing_type === "service" ? "service" : "product",
    quantity: r.quantity,
    total: r.total,
    currency: r.currency,
    phone: r.phone,
    status: r.status as OrderStatus,
    createdAt: r.created_at,
  }));
}

export async function saveOrderRow(order: CustomerOrder) {
  await insert(await db(), order);
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  await (await db()).runAsync("UPDATE orders SET status = ? WHERE id = ?", status, id);
}
