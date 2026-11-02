"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export default function AdminLogin({ configured }: { configured: boolean }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, null);

  return (
    <div className="page-fade mx-auto mt-14 w-full max-w-sm rounded-3xl border border-gold/25 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold/80">
        Ismot · Staff
      </p>
      <h1 className="overlay-title mt-2 text-3xl text-cream">Order management</h1>
      <p className="mt-2 text-sm leading-relaxed text-cream/60">
        Sign in to view orders and export the spreadsheet.
      </p>

      {!configured && (
        <p className="mt-5 rounded-xl border border-gold/25 bg-gold/10 px-4 py-3 text-xs leading-relaxed text-cream/80">
          Admin access is not configured. Add <code className="text-gold-soft">ADMIN_PASSWORD</code>{" "}
          to the server environment (see <code className="text-gold-soft">.env.example</code>), then
          reload this page.
        </p>
      )}

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label htmlFor="admin-password" className="mb-1.5 block text-[13px] font-semibold text-cream/90">
            Admin password
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="field"
            required
            aria-invalid={state?.error ? true : undefined}
            aria-describedby={state?.error ? "admin-error" : undefined}
          />
        </div>

        {state?.error && (
          <p id="admin-error" role="alert" className="text-xs font-medium text-danger">
            {state.error}
          </p>
        )}

        <button type="submit" className="btn-gold w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
