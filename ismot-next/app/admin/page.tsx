import type { Metadata } from "next";
import Link from "next/link";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { listOrders, ORDER_STATUSES, storageKind, type Order } from "@/lib/orders";
import { logout, updateStatus } from "./actions";
import AdminLogin from "./login-form";

export const metadata: Metadata = {
  title: "Order management — Ismot Hair Oil",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Dhaka",
});

const STATUS_STYLES: Record<string, string> = {
  Pending: "border-gold/40 bg-gold/10 text-gold-soft",
  Confirmed: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  Processing: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  Delivered: "border-lime-400/40 bg-lime-400/10 text-lime-200",
  Cancelled: "border-rose-400/40 bg-rose-400/10 text-rose-200",
};

function StatusForm({ order }: { order: Order }) {
  return (
    <form action={updateStatus} className="flex items-center gap-2">
      <input type="hidden" name="id" value={order.id} />
      <label className="sr-only" htmlFor={`status-${order.id}`}>
        Status for {order.orderRef}
      </label>
      <select
        id={`status-${order.id}`}
        name="status"
        defaultValue={order.status}
        className="rounded-lg border border-gold/25 bg-forest-deep/70 px-2.5 py-1.5 text-xs text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft"
      >
        {ORDER_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-lg border border-gold/40 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gold-soft transition-colors hover:bg-gold/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft"
      >
        Save
      </button>
    </form>
  );
}

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <main className="order-shell min-h-svh w-full px-4 pb-16 pt-2 sm:px-6">
        <AdminLogin configured={adminConfigured()} />
      </main>
    );
  }

  const orders = await listOrders();
  const pending = orders.filter((order) => order.status === "Pending").length;

  return (
    <main className="order-shell min-h-svh w-full px-4 pb-16 pt-6 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold/80">
              Ismot · Staff
            </p>
            <h1 className="overlay-title mt-2 text-[clamp(1.8rem,4vw,2.4rem)] text-cream">
              Orders
            </h1>
            <p className="mt-1 text-sm text-cream/60">
              {orders.length} total · {pending} pending
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a href="/api/admin/export" className="btn-ghost !px-4 !py-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M4 21h16" />
              </svg>
              Export .xlsx
            </a>
            <Link href="/" className="btn-ghost !px-4 !py-2">
              View site
            </Link>
            <form action={logout}>
              <button type="submit" className="btn-ghost !px-4 !py-2">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <p className="mt-4 rounded-xl border border-gold/20 bg-gold/[0.06] px-4 py-3 text-xs leading-relaxed text-cream/70">
          Storage:{" "}
          <strong className="text-gold-soft">
            {storageKind() === "supabase" ? "Supabase" : "local SQLite (.data/orders.db)"}
          </strong>
          .{" "}
          {storageKind() === "supabase"
            ? "Orders are live in your Supabase project."
            : "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for production, or keep exporting the spreadsheet from here."}
        </p>

        {orders.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-gold/20 bg-white/[0.03] px-6 py-12 text-center">
            <p className="text-sm text-cream/70">No orders yet.</p>
            <p className="mt-1 text-xs text-cream/45">
              New orders from the order page will appear here immediately.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-gold/20 lg:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-white/[0.05] text-[10px] uppercase tracking-[0.16em] text-gold/80">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Delivery address</th>
                    <th className="px-4 py-3 font-semibold">Qty</th>
                    <th className="px-4 py-3 font-semibold">Placed</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-gold/10 align-top">
                      <td className="px-4 py-4">
                        <span className="font-mono text-[13px] text-gold-soft">#{order.orderRef}</span>
                        <span
                          className={`mt-1.5 block w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[order.status]}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="block font-semibold text-cream">{order.customerName}</span>
                        <a
                          href={`tel:${order.phone}`}
                          className="mt-0.5 block text-[13px] text-sage hover:text-gold-soft"
                        >
                          {order.phone}
                        </a>
                      </td>
                      <td className="max-w-xs px-4 py-4 text-[13px] leading-relaxed text-cream/70">
                        {order.address}
                      </td>
                      <td className="px-4 py-4 text-cream/80">{order.quantity}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-[12px] text-cream/55">
                        {dateFormat.format(new Date(order.createdAt))}
                      </td>
                      <td className="px-4 py-4">
                        <StatusForm order={order} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="mt-6 space-y-3 lg:hidden">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="rounded-2xl border border-gold/20 bg-white/[0.04] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-[13px] text-gold-soft">#{order.orderRef}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <p className="mt-3 font-semibold text-cream">{order.customerName}</p>
                  <a href={`tel:${order.phone}`} className="block text-[13px] text-sage">
                    {order.phone}
                  </a>
                  <p className="mt-2 text-[13px] leading-relaxed text-cream/70">{order.address}</p>

                  <p className="mt-2 text-xs text-cream/50">
                    {order.quantity} × {order.product} ({order.size}) ·{" "}
                    {dateFormat.format(new Date(order.createdAt))}
                  </p>

                  <div className="mt-3 border-t border-gold/10 pt-3">
                    <StatusForm order={order} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
