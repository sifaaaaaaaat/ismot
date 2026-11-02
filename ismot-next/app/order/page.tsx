import type { Metadata } from "next";
import Link from "next/link";
import { getProduct } from "@/lib/product";
import Wordmark from "../wordmark";
import OrderForm from "./order-form";

export const metadata: Metadata = {
  title: "Place your order — Ismot Hair Oil",
  description:
    "Order a 100 ml bottle of Ismot Hair Oil. Enter your name, mobile number and delivery address — we will call to confirm.",
};

/**
 * /order — the only checkout.
 *
 * Product and (optional) price are read on the server, so the price is never
 * baked into client code and is simply absent when `PRODUCT_PRICE_BDT` is not
 * configured.
 */
export default function OrderPage() {
  const product = getProduct();

  return (
    <main className="order-shell min-h-svh w-full px-4 pb-14 pt-5 sm:px-6 sm:pt-8">
      <div className="mx-auto w-full max-w-2xl">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center rounded-lg py-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-soft"
            aria-label="Ismot Hair Oil — back to home"
          >
            <Wordmark />
          </Link>

          <Link href="/" className="btn-ghost !px-4 !py-2 !text-[10px] sm:!text-[11px]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5" />
              <path d="m12 5-7 7 7 7" />
            </svg>
            Home
          </Link>
        </header>

        <OrderForm product={product} />
      </div>
    </main>
  );
}
