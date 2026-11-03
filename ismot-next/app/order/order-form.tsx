"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { formatPrice, MAX_QUANTITY, MIN_QUANTITY, type Product } from "@/lib/product";
import { createId } from "@/lib/id";
import { validateOrder, type OrderField } from "@/lib/validation";

type Status = "idle" | "submitting" | "error";

const FIELDS: { key: OrderField; label: string; hint?: string; type: string; autoComplete: string; placeholder: string }[] = [
  {
    key: "name",
    label: "Full name",
    type: "text",
    autoComplete: "name",
    placeholder: "e.g. Ayesha Rahman",
  },
  {
    key: "phone",
    label: "Mobile number",
    hint: "Bangladeshi number, e.g. 01712345678. We only use it to confirm your delivery.",
    type: "tel",
    autoComplete: "tel",
    placeholder: "01XXXXXXXXX",
  },
];

export default function OrderForm({ product }: { product: Product }) {
  const uid = useId();
  const [values, setValues] = useState({ name: "", phone: "", address: "" });
  const [quantity, setQuantity] = useState(MIN_QUANTITY);
  const [errors, setErrors] = useState<Partial<Record<OrderField | "quantity", string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState("");
  const [placed, setPlaced] = useState<{ orderRef: string } | null>(null);

  const submissionId = useRef<string>(createId());
  const startedAt = useRef<number>(0);
  const inputs = useRef<Partial<Record<OrderField, HTMLInputElement | HTMLTextAreaElement | null>>>({});

  // Set after mount rather than during render: the timestamp is only used by the
  // spam check on the server.
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const price = product.price;

  function update(field: OrderField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting" || placed) return;

    const result = validateOrder({ ...values, quantity });
    if (!result.ok) {
      setErrors(result.errors);
      setStatus("idle");
      const first = (["name", "phone", "address"] as OrderField[]).find((field) => result.errors[field]);
      if (first) inputs.current[first]?.focus();
      return;
    }

    setErrors({});
    setFormError("");
    setStatus("submitting");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.value.customerName,
          phone: result.value.phone,
          address: result.value.address,
          quantity: result.value.quantity,
          submissionId: submissionId.current,
          startedAt: startedAt.current || Date.now(),
          website: "",
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        orderRef?: string;
        error?: string;
        errors?: Partial<Record<OrderField, string>>;
      };

      if (!response.ok || !data.orderRef) {
        if (data.errors) setErrors(data.errors);
        setFormError(data.error ?? "We could not place your order. Please try again.");
        setStatus("error");
        return;
      }

      setPlaced({ orderRef: data.orderRef });
      setStatus("idle");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFormError(
        "We could not reach the server. Check your connection and try again — your details are still here.",
      );
      setStatus("error");
    }
  }

  if (placed) {
    return (
      <section
        className="page-fade mx-auto mt-10 w-full max-w-xl rounded-3xl border border-gold/25 bg-white/[0.04] p-7 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-10"
        aria-live="polite"
      >
        <span className="mx-auto flex size-16 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m4 12.5 5 5L20 6.5" />
          </svg>
        </span>

        <h1 className="overlay-title mt-6 text-[clamp(1.9rem,5vw,2.6rem)] text-cream">
          Thank you for your order!
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-cream/75">
          Your Ismot Hair Oil order has been successfully received.
        </p>

        <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/[0.07] px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold/80">
            Order reference
          </p>
          <p className="mt-1.5 font-mono text-xl tracking-[0.08em] text-gold-soft">
            #{placed.orderRef}
          </p>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-cream/70">
          Our team will contact you using the provided mobile number to confirm your order.
        </p>

        <Link href="/" className="btn-gold mt-8 w-full">
          Back to home
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5" />
            <path d="m12 5-7 7 7 7" />
          </svg>
        </Link>
      </section>
    );
  }

  return (
    <div className="page-fade mt-8 w-full">
      <h1 className="overlay-title text-[clamp(2rem,6vw,2.9rem)] text-cream">Complete your order</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-cream/65">
        Three details and you&apos;re done. We&apos;ll call you to confirm — no online
        payment needed.
      </p>

      <section
        aria-labelledby={`${uid}-summary`}
        className="mt-7 rounded-3xl border border-gold/22 bg-white/[0.045] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:p-5"
      >
        <div className="flex items-start gap-4">
          <div className="relative flex h-28 w-20 shrink-0 items-center justify-center rounded-2xl border border-gold/15 bg-[radial-gradient(circle_at_50%_35%,rgba(216,184,119,0.22),rgba(7,18,10,0.9))]">
            <Image
              src="/bottle.webp"
              alt=""
              width={160}
              height={440}
              className="h-[88%] w-auto rotate-[8deg] object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)]"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-gold/80">
              Your order
            </p>
            <h2 id={`${uid}-summary`} className="overlay-title mt-1 text-2xl leading-tight text-cream">
              {product.name}
            </h2>
            <p className="mt-1 text-sm text-sage">Size {product.size}</p>

            <dl className="mt-3 space-y-1.5 text-sm">
              {price !== null && (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-cream/60">Price</dt>
                  <dd className="font-semibold text-cream">{formatPrice(price)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-cream/60">Quantity</dt>
                <dd className="font-semibold text-cream">{quantity}</dd>
              </div>
              {price !== null && (
                <div className="flex items-baseline justify-between gap-3 border-t border-gold/15 pt-1.5">
                  <dt className="font-semibold text-cream/80">Total</dt>
                  <dd className="font-bold text-gold-soft">{formatPrice(price * quantity)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-gold/15 bg-forest-deep/40 px-3 py-2">
          <span className="pl-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/60">
            100 ml bottles
          </span>
          <div className="flex items-center gap-1">
            <QuantityButton
              label="Decrease quantity"
              onClick={() => setQuantity((value) => Math.max(MIN_QUANTITY, value - 1))}
              disabled={quantity <= MIN_QUANTITY}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14" />
              </svg>
            </QuantityButton>
            <output aria-live="polite" className="w-10 text-center text-base font-bold text-cream">
              {quantity}
            </output>
            <QuantityButton
              label="Increase quantity"
              onClick={() => setQuantity((value) => Math.min(MAX_QUANTITY, value + 1))}
              disabled={quantity >= MAX_QUANTITY}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </QuantityButton>
          </div>
        </div>
        {errors.quantity && (
          <p className="mt-2 pl-1 text-xs text-danger" role="alert">
            {errors.quantity}
          </p>
        )}
      </section>

      <form onSubmit={handleSubmit} noValidate className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/80">
          Delivery details
        </h2>

        <div className="mt-4 space-y-5">
          {FIELDS.map((field) => {
            const error = errors[field.key];
            const describedBy = `${uid}-${field.key}-hint ${error ? `${uid}-${field.key}-error` : ""}`.trim();
            return (
              <div key={field.key}>
                <label
                  htmlFor={`${uid}-${field.key}`}
                  className="mb-1.5 block text-[13px] font-semibold text-cream/90"
                >
                  {field.label} <span className="text-gold">*</span>
                </label>
                <input
                  id={`${uid}-${field.key}`}
                  ref={(node) => {
                    inputs.current[field.key] = node;
                  }}
                  name={field.key}
                  type={field.type}
                  inputMode={field.key === "phone" ? "tel" : "text"}
                  autoComplete={field.autoComplete}
                  placeholder={field.placeholder}
                  value={values[field.key]}
                  onChange={(event) => update(field.key, event.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={describedBy}
                  className="field"
                  required
                />
                {field.hint && !error && (
                  <p id={`${uid}-${field.key}-hint`} className="mt-1.5 text-xs text-cream/45">
                    {field.hint}
                  </p>
                )}
                {error && (
                  <p
                    id={`${uid}-${field.key}-error`}
                    role="alert"
                    className="mt-1.5 text-xs font-medium text-danger"
                  >
                    {error}
                  </p>
                )}
              </div>
            );
          })}

          <div>
            <label
              htmlFor={`${uid}-address`}
              className="mb-1.5 block text-[13px] font-semibold text-cream/90"
            >
              Delivery address <span className="text-gold">*</span>
            </label>
            <textarea
              id={`${uid}-address`}
              ref={(node) => {
                inputs.current.address = node;
              }}
              name="address"
              rows={4}
              autoComplete="street-address"
              placeholder={"House / flat, road, area, city\nAny landmark or delivery note"}
              value={values.address}
              onChange={(event) => update("address", event.target.value)}
              aria-invalid={errors.address ? true : undefined}
              aria-describedby={`${uid}-address-hint ${errors.address ? `${uid}-address-error` : ""}`.trim()}
              className="field resize-y"
              required
            />
            {errors.address ? (
              <p id={`${uid}-address-error`} role="alert" className="mt-1.5 text-xs font-medium text-danger">
                {errors.address}
              </p>
            ) : (
              <p id={`${uid}-address-hint`} className="mt-1.5 text-xs text-cream/45">
                Include landmarks, floor or any delivery instructions here.
              </p>
            )}
          </div>
        </div>

        {formError && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-danger/50 bg-danger/10 px-4 py-3 text-sm leading-relaxed text-cream"
          >
            {formError}
          </div>
        )}

        <button type="submit" className="btn-gold mt-7 w-full" disabled={status === "submitting"}>
          {status === "submitting" ? (
            <>
              <span className="spinner inline-block size-4 rounded-full border-2 border-forest-deep/30 border-t-forest-deep" />
              Placing your order…
            </>
          ) : (
            <>
              Confirm order
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </>
          )}
        </button>

        <p className="mt-4 text-center text-xs leading-relaxed text-cream/45">
          We only use these details to deliver and confirm your order.
        </p>
      </form>
    </div>
  );
}

function QuantityButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-full border border-gold/30 text-gold-soft transition-colors hover:bg-gold/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
