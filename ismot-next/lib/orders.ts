import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

/**
 * Order storage.
 *
 * Two interchangeable backends behind one small interface:
 *
 *  - **Supabase** (PostgREST) when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are
 *    set. The service-role key never leaves the server; the table has RLS on
 *    with no policies so anon/public keys cannot read customer data.
 *  - **SQLite** (`node:sqlite`, Node's built-in driver) otherwise, so a fresh
 *    clone works with no accounts or credentials. This file is deliberately
 *    local-only: serverless hosts have no persistent disk, so production must
 *    run on the Supabase backend.
 *
 * Nothing here is imported by client code.
 */

export const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Delivered",
  "Cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type Order = {
  id: string;
  orderRef: string;
  customerName: string;
  phone: string;
  address: string;
  product: string;
  size: string;
  quantity: number;
  status: OrderStatus;
  createdAt: string;
};

export type NewOrder = {
  customerName: string;
  phone: string;
  address: string;
  product: string;
  size: string;
  quantity: number;
  /** Client-generated key: a retried submit returns the same order. */
  submissionId: string;
};

/** No 0/O/1/I so a reference can be read out over the phone without mistakes. */
const REF_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function makeOrderRef(): string {
  const bytes = randomBytes(5);
  let ref = "";
  for (const byte of bytes) ref += REF_ALPHABET[byte % REF_ALPHABET.length];
  return `ISMOT-${ref}`;
}

/* -------------------------------------------------------------------------- */
/* Backend selection                                                           */
/* -------------------------------------------------------------------------- */

type SupabaseConfig = { url: string; key: string };

function supabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return { url, key };
}

export function storageKind(): "supabase" | "sqlite" {
  return supabaseConfig() ? "supabase" : "sqlite";
}

/* -------------------------------------------------------------------------- */
/* SQLite                                                                     */
/* -------------------------------------------------------------------------- */

type SqliteGlobal = typeof globalThis & { __ismotOrdersDb?: DatabaseSync };
const sqliteGlobal = globalThis as SqliteGlobal;

function sqlite(): DatabaseSync {
  if (sqliteGlobal.__ismotOrdersDb) return sqliteGlobal.__ismotOrdersDb;

  const file =
    process.env.ORDERS_DB_PATH?.trim() || path.join(process.cwd(), ".data", "orders.db");

  fs.mkdirSync(path.dirname(file), { recursive: true });

  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS orders (
      id            TEXT PRIMARY KEY,
      order_ref     TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      phone         TEXT NOT NULL,
      address       TEXT NOT NULL,
      product       TEXT NOT NULL,
      size          TEXT NOT NULL,
      quantity      INTEGER NOT NULL,
      status        TEXT NOT NULL DEFAULT 'Pending',
      submission_id TEXT NOT NULL UNIQUE,
      created_at    TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
  `);

  sqliteGlobal.__ismotOrdersDb = db;
  return db;
}

type SqliteRow = {
  id: string;
  order_ref: string;
  customer_name: string;
  phone: string;
  address: string;
  product: string;
  size: string;
  quantity: number;
  status: string;
  created_at: string;
};

function toOrder(row: SqliteRow): Order {
  return {
    id: row.id,
    orderRef: row.order_ref,
    customerName: row.customer_name,
    phone: row.phone,
    address: row.address,
    product: row.product,
    size: row.size,
    quantity: Number(row.quantity),
    status: (ORDER_STATUSES as readonly string[]).includes(row.status)
      ? (row.status as OrderStatus)
      : "Pending",
    createdAt: row.created_at,
  };
}

/* -------------------------------------------------------------------------- */
/* Supabase (PostgREST)                                                       */
/* -------------------------------------------------------------------------- */

type SupabaseRow = SqliteRow;

function toOrderFromSupabase(row: SupabaseRow): Order {
  return toOrder(row);
}

async function supabaseRequest(
  cfg: SupabaseConfig,
  pathname: string,
  init: { method: string; body?: unknown; prefer?: string },
): Promise<Response> {
  return fetch(`${cfg.url}/rest/v1/${pathname}`, {
    method: init.method,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
}

async function supabaseError(response: Response): Promise<Error> {
  const detail = await response.text().catch(() => "");
  return new Error(`Supabase ${response.status}: ${detail.slice(0, 300)}`);
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Creates an order. `submissionId` makes the call idempotent: retrying the same
 * submission returns the order that already exists instead of a duplicate row.
 */
export async function createOrder(input: NewOrder): Promise<Order> {
  const cfg = supabaseConfig();
  const createdAt = new Date().toISOString();

  if (cfg) {
    const existing = await getOrderBySubmission(input.submissionId);
    if (existing) return existing;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const orderRef = makeOrderRef();
      const response = await supabaseRequest(cfg, "orders?on_conflict=submission_id", {
        method: "POST",
        prefer: "resolution=ignore-duplicates,return=representation",
        body: {
          order_ref: orderRef,
          customer_name: input.customerName,
          phone: input.phone,
          address: input.address,
          product: input.product,
          size: input.size,
          quantity: input.quantity,
          status: "Pending",
          submission_id: input.submissionId,
          created_at: createdAt,
        },
      });

      if (!response.ok) {
        const error = await supabaseError(response);
        if (/order_ref/i.test(error.message) && attempt < 4) continue;
        throw error;
      }

      const rows = (await response.json()) as SupabaseRow[];
      if (rows.length > 0) return toOrderFromSupabase(rows[0]);

      // The insert was ignored: this submission already landed. Return it.
      const already = await getOrderBySubmission(input.submissionId);
      if (already) return already;
    }

    throw new Error("Could not allocate a unique order reference.");
  }

  const db = sqlite();
  const existing = db
    .prepare("SELECT * FROM orders WHERE submission_id = ?")
    .get(input.submissionId) as SqliteRow | undefined;
  if (existing) return toOrder(existing);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = randomBytes(12).toString("hex");
    const orderRef = makeOrderRef();
    try {
      db.prepare(
        `INSERT INTO orders
           (id, order_ref, customer_name, phone, address, product, size, quantity, status, submission_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`,
      ).run(
        id,
        orderRef,
        input.customerName,
        input.phone,
        input.address,
        input.product,
        input.size,
        input.quantity,
        input.submissionId,
        createdAt,
      );

      return {
        id,
        orderRef,
        customerName: input.customerName,
        phone: input.phone,
        address: input.address,
        product: input.product,
        size: input.size,
        quantity: input.quantity,
        status: "Pending",
        createdAt,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/submission_id/i.test(message)) {
        const duplicate = await getOrderBySubmission(input.submissionId);
        if (duplicate) return duplicate;
      }
      // A reference collision is astronomically unlikely, but retrying costs
      // nothing and guarantees the customer never sees a failed save for it.
      if (!/order_ref/i.test(message) || attempt === 4) throw error;
    }
  }

  throw new Error("Could not allocate a unique order reference.");
}

/** The order a given submission already created, if any (idempotent retries). */
export async function getOrderBySubmission(submissionId: string): Promise<Order | null> {
  const cfg = supabaseConfig();
  if (cfg) {
    const response = await supabaseRequest(
      cfg,
      `orders?submission_id=eq.${encodeURIComponent(submissionId)}&select=*&limit=1`,
      { method: "GET" },
    );
    if (!response.ok) throw await supabaseError(response);
    const rows = (await response.json()) as SupabaseRow[];
    return rows.length > 0 ? toOrderFromSupabase(rows[0]) : null;
  }

  const row = sqlite()
    .prepare("SELECT * FROM orders WHERE submission_id = ?")
    .get(submissionId) as SqliteRow | undefined;
  return row ? toOrder(row) : null;
}

/** Admin only: newest first. */
export async function listOrders(limit = 500): Promise<Order[]> {
  const cfg = supabaseConfig();
  if (cfg) {
    const response = await supabaseRequest(
      cfg,
      `orders?select=*&order=created_at.desc&limit=${Math.trunc(limit)}`,
      { method: "GET" },
    );
    if (!response.ok) throw await supabaseError(response);
    return ((await response.json()) as SupabaseRow[]).map(toOrderFromSupabase);
  }

  const rows = sqlite()
    .prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT ?")
    .all(Math.trunc(limit)) as SqliteRow[];
  return rows.map(toOrder);
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<void> {
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
    throw new Error("Unknown order status.");
  }

  const cfg = supabaseConfig();
  if (cfg) {
    const response = await supabaseRequest(cfg, `orders?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: { status },
    });
    if (!response.ok) throw await supabaseError(response);
    return;
  }

  sqlite().prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
}

/** Orders created in the last `windowMs` for the same phone — spam guard. */
export async function countRecentOrdersByPhone(phone: string, windowMs: number): Promise<number> {
  const since = new Date(Date.now() - windowMs).toISOString();
  const cfg = supabaseConfig();

  if (cfg) {
    const response = await supabaseRequest(
      cfg,
      `orders?phone=eq.${encodeURIComponent(phone)}&created_at=gte.${encodeURIComponent(since)}&select=id`,
      { method: "GET" },
    );
    if (!response.ok) throw await supabaseError(response);
    return ((await response.json()) as { id: string }[]).length;
  }

  const row = sqlite()
    .prepare("SELECT COUNT(*) AS count FROM orders WHERE phone = ? AND created_at >= ?")
    .get(phone, since) as { count: number } | undefined;
  return Number(row?.count ?? 0);
}
