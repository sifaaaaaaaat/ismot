import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Admin session.
 *
 * There is no customer or staff account system here, so admin access is a
 * single password held in the server environment. The cookie is an expiring,
 * HMAC-signed token — not the password itself — and it is httpOnly, so no
 * client script can read or forge it.
 *
 * ADMIN_PASSWORD is required. Without it the admin area reports that it is not
 * configured instead of falling open.
 */

const COOKIE_NAME = "ismot_admin";
const SESSION_MS = 8 * 60 * 60 * 1000;

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD?.trim());
}

function signingSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    "ismot-unconfigured"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

function createToken(): string {
  const expiresAt = String(Date.now() + SESSION_MS);
  return `${expiresAt}.${sign(expiresAt)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;

  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;

  const expires = Number(expiresAt);
  if (!Number.isFinite(expires) || expires <= Date.now()) return false;

  const expected = Buffer.from(sign(expiresAt));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function isAdmin(): Promise<boolean> {
  if (!adminConfigured()) return false;
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

export function passwordMatches(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;

  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  // Compare regardless of length so the timing does not leak it.
  const equal = a.length === b.length ? timingSafeEqual(a, b) : timingSafeEqual(b, b);
  return equal && a.length === b.length;
}

export async function startAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, createToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_MS / 1000),
  });
}

export async function endAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Never expose order data through a guessable reference. */
export function newAdminNonce(): string {
  return randomBytes(8).toString("hex");
}
