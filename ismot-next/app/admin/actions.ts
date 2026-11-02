"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  adminConfigured,
  endAdminSession,
  isAdmin,
  passwordMatches,
  startAdminSession,
} from "@/lib/admin-auth";
import { ORDER_STATUSES, setOrderStatus, type OrderStatus } from "@/lib/orders";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export type LoginState = { error: string } | null;

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const address = clientKey(await headers());
  const attempt = rateLimit(`admin-login:${address}`, MAX_ATTEMPTS, WINDOW_MS);

  if (!attempt.ok) {
    const minutes = Math.max(1, Math.ceil(attempt.retryAfter / 60));
    return { error: `Too many attempts. Please try again in ${minutes} minute(s).` };
  }

  if (!adminConfigured()) {
    return {
      error:
        "Admin access is not configured. Set ADMIN_PASSWORD in the server environment first.",
    };
  }

  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) return { error: "Incorrect password." };

  await startAdminSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endAdminSession();
  redirect("/admin");
}

export async function updateStatus(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!id || !(ORDER_STATUSES as readonly string[]).includes(status)) return;

  await setOrderStatus(id, status as OrderStatus);
  revalidatePath("/admin");
}
