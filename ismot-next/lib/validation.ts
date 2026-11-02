/**
 * Validation shared by the order form (client) and the API route (server).
 * Keeping one implementation means the browser can never accept something the
 * server rejects, or the other way round.
 */

import { MAX_QUANTITY, MIN_QUANTITY } from "./product";

export type OrderDraft = {
  name: string;
  phone: string;
  address: string;
  quantity: number;
};

export type OrderField = "name" | "phone" | "address";

export type OrderValue = {
  customerName: string;
  phone: string;
  address: string;
  quantity: number;
};

export type ValidationResult =
  | { ok: true; value: OrderValue }
  | { ok: false; errors: Partial<Record<OrderField | "quantity", string>> };

/** 013–019, then eight digits: the full range of Bangladeshi mobile operators. */
const BD_MOBILE = /^01[3-9]\d{8}$/;

/**
 * Accepts +880…, 880…, 88…, 01… and any spacing/dashes, and returns the
 * canonical local form (01XXXXXXXXX) that the shopkeeper will dial.
 */
export function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, "");

  if (digits.startsWith("880")) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith("88")) digits = `0${digits.slice(2)}`;
  else if (digits.startsWith("1") && digits.length === 10) digits = `0${digits}`;

  return digits;
}

export function isValidBdMobile(input: string): boolean {
  return BD_MOBILE.test(normalizePhone(input));
}

export function validateOrder(draft: OrderDraft): ValidationResult {
  const errors: Partial<Record<OrderField | "quantity", string>> = {};

  const customerName = draft.name.replace(/\s+/g, " ").trim();
  const address = draft.address.replace(/[ \t]+/g, " ").trim();
  const phone = normalizePhone(draft.phone);

  if (customerName.length === 0) {
    errors.name = "Please enter your full name.";
  } else if (customerName.length < 2) {
    errors.name = "Please enter at least 2 characters.";
  } else if (customerName.length > 80) {
    errors.name = "Please keep your name under 80 characters.";
  }

  if (phone.length === 0) {
    errors.phone = "Please enter your mobile number.";
  } else if (!BD_MOBILE.test(phone)) {
    errors.phone =
      "Enter a valid Bangladesh mobile number, e.g. 01712345678 (11 digits starting 013–019).";
  }

  if (address.length === 0) {
    errors.address = "Please enter your full delivery address.";
  } else if (address.length < 10) {
    errors.address = "Please add a bit more detail so we can find you.";
  } else if (address.length > 500) {
    errors.address = "Please keep the address under 500 characters.";
  }

  const quantity = Number.isFinite(draft.quantity) ? Math.trunc(draft.quantity) : 0;
  if (quantity < MIN_QUANTITY || quantity > MAX_QUANTITY) {
    errors.quantity = `Choose a quantity between ${MIN_QUANTITY} and ${MAX_QUANTITY}.`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return { ok: true, value: { customerName, phone, address, quantity } };
}

export const FIELD_MESSAGES: Record<OrderField, string> = {
  name: "Please enter your full name.",
  phone: "Enter a valid Bangladesh mobile number, e.g. 01712345678.",
  address: "Please enter your full delivery address.",
};
