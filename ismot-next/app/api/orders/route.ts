import { NextResponse } from "next/server";
import { createOrder, countRecentOrdersByPhone, getOrderBySubmission } from "@/lib/orders";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getProduct } from "@/lib/product";
import { validateOrder } from "@/lib/validation";

/**
 * POST /api/orders — the only way an order is created.
 *
 * Every check runs server-side: same-origin, rate limit, honeypot/timing,
 * shared validation, per-phone cool-down. The response is withheld until the
 * row is actually written, so the confirmation screen can never lie.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8 * 1024;

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (origin) {
    try {
      return new URL(origin).host === request.headers.get("host");
    } catch {
      return false;
    }
  }

  // No Origin header: browsers do not send one for every same-site fetch, but
  // they always send Sec-Fetch-Site. Absent both (curl, server-to-server), the
  // request still has to pass the rate limit and validation below.
  const site = request.headers.get("sec-fetch-site");
  return site === null || site === "same-origin" || site === "none";
}

function fail(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return fail("This request was blocked for security reasons.", 403);
  }

  const ip = clientKey(request.headers);
  const limit = rateLimit(`orders:${ip}`, 6, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) {
    return fail("That submission was too large.", 413);
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail("We could not read that request.", 400);
  }

  // Bots fill every field they find and submit instantly. Humans do neither.
  if (typeof payload.website === "string" && payload.website.trim() !== "") {
    return fail("We could not place your order.", 400);
  }
  const startedAt = Number(payload.startedAt);
  if (Number.isFinite(startedAt) && Date.now() - startedAt < 700) {
    return NextResponse.json(
      { error: "Please take a moment to check your details, then try again." },
      { status: 429 },
    );
  }

  const submissionId = typeof payload.submissionId === "string" ? payload.submissionId : "";
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(submissionId)) {
    return fail("We could not place your order. Please reload the page.", 400);
  }

  const result = validateOrder({
    name: typeof payload.name === "string" ? payload.name : "",
    phone: typeof payload.phone === "string" ? payload.phone : "",
    address: typeof payload.address === "string" ? payload.address : "",
    quantity: Number(payload.quantity),
  });

  if (!result.ok) {
    return fail("Please check the highlighted fields.", 422, { errors: result.errors });
  }

  const product = getProduct();

  try {
    // A retry (double click, flaky connection, back-and-forward) must not look
    // like a rejection: hand back the order this submission already created.
    const already = await getOrderBySubmission(submissionId);
    if (already) {
      return NextResponse.json({ orderRef: already.orderRef }, { status: 200 });
    }

    const recent = await countRecentOrdersByPhone(result.value.phone, 60 * 1000);
    if (recent > 0) {
      return NextResponse.json(
        {
          error:
            "An order from this number was just received. We will call you to confirm it — please don't submit again.",
        },
        { status: 429 },
      );
    }

    const order = await createOrder({
      customerName: result.value.customerName,
      phone: result.value.phone,
      address: result.value.address,
      product: product.name,
      size: product.size,
      quantity: result.value.quantity,
      submissionId,
    });

    return NextResponse.json({ orderRef: order.orderRef }, { status: 201 });
  } catch (error) {
    console.error("[orders] failed to save order", error);
    return fail(
      "We could not save your order just now. Please try again, or call us if it keeps happening.",
      500,
    );
  }
}

export async function GET() {
  return fail("Use POST to place an order.", 405);
}
