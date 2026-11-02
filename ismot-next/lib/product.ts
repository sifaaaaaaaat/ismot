/**
 * The one product this store sells.
 *
 * The price is deliberately NOT hard-coded: the brief forbids inventing one, so
 * it is read from `PRODUCT_PRICE_BDT` and every price row in the UI is omitted
 * when that variable is unset. Set it in `.env.local` (e.g. PRODUCT_PRICE_BDT=1250)
 * and the summary shows ৳ 1,250.
 */

export type Product = {
  name: string;
  size: string;
  /** Whole BDT, or null when the shop owner has not configured a price. */
  price: number | null;
};

export const PRODUCT: Product = {
  name: "Ismot Hair Oil",
  size: "100 ml",
  price: null,
};

/** Price as configured on the server, or null. Never a guessed value. */
export function getProduct(): Product {
  const raw = process.env.PRODUCT_PRICE_BDT?.trim();
  const parsed = raw && /^\d{1,7}$/.test(raw) ? Number(raw) : null;
  return { ...PRODUCT, price: parsed && parsed > 0 ? parsed : null };
}

/** 1250 -> "৳ 1,250" (grouped by hand so server and client always agree). */
export function formatPrice(value: number): string {
  return `৳ ${String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 10;
