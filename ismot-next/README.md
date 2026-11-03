# Ismot Hair Oil — site & order system

A single-product store for **Ismot Hair Oil (100 ml)**. There are two customer
screens and one staff screen:

| Route   | What it is                                                        |
| ------- | ----------------------------------------------------------------- |
| `/`     | The full-screen promotional artwork. Nothing below it, no scroll.  |
| `/order`| The order form: name, mobile number, delivery address.             |
| `/admin`| Staff order list, status updates and the `.xlsx` export.            |
| `/api/orders` | `POST` only — the one way an order is created.               |
| `/api/admin/export` | Admin-only spreadsheet download.                          |

---

## Quick start

```bash
cd ismot-next
npm install
npm run dev          # next dev picks a free port — read the printed URL
```

Optional but recommended, in `ismot-next/.env.local` (see `.env.example`):

```bash
PRODUCT_PRICE_BDT=1250      # omit and no price is shown anywhere
ADMIN_PASSWORD=change-me    # required to open /admin
```

With **no** database configured, orders are stored in `ismot-next/.data/orders.db`
(SQLite, created on first order, git-ignored). For production set
`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` and run `supabase/schema.sql` once —
see [Storage](#storage) below.

Other scripts, from `ismot-next/`:

| command         | what it does                           |
| --------------- | -------------------------------------- |
| `npm run dev`   | dev server (Turbopack)                 |
| `npm run build` | production build                       |
| `npm run start` | serve the production build             |
| `npm run lint`  | ESLint (`eslint-config-next`)          |
| `npx tsc --noEmit` | type-check                          |

---

## Homepage: the poster hero

`app/hero.tsx` renders `public/hero-phone-bleed.webp` at its own aspect ratio, and
lays **real buttons over the controls that are painted into it**:

| painted control          | element            | action                    |
| ------------------------ | ------------------ | ------------------------- |
| Order Now pill           | `<Link>`           | `/order`                  |
| shopping-bag icon        | `<Link>`           | `/order`                  |
| hamburger icon           | `<button>`         | menu panel                |
| logo                     | `<Link>`           | `/`                       |

Each control is a percentage box of the painted poster (`HOTSPOTS` in
`hero.tsx`, measured from the artwork with `tools/measure_hero.py`):

| control     | left  | top   | width | height |
| ----------- | ----- | ----- | ----- | ------ |
| order       | 24.50 | 81.80 | 51.00 | 7.40   |
| bag         | 75.10 | 6.78  | 7.00  | 5.00   |
| menu        | 86.26 | 6.86  | 7.50  | 5.00   |
| logo        | 2.97  | 5.74  | 32.94 | 7.50   |

This artwork paints no About / Benefits / Ingredients labels, so those panels
are reached from the menu panel instead.

**If you change the artwork, re-measure these.** They only stay aligned because
`.hero-content` (in `globals.css`) is exactly the painted poster's rectangle and
the image fills it — the percentages then resolve against the same box the
artwork is drawn into at every viewport size. The bag and menu boxes sit just
apart, never overlapping.

The artwork is 841 × 1870 (about 9:20). The delivered file is 1053 × 1870: the
artwork with a 106 px strip down each side, mirrored from its own edges and
blurred by `tools/build_hero_asset.py`, so a phone that is a little wider than
the artwork is filled with picture instead of a dark band. On a phone the poster
box keeps the file's ratio and is grown until it covers the screen
(`width: max(100vw, 100svh * 1053 / 1870)`); the `h-svh`, `overflow-hidden` root
centres it and clips only the added strip. `.hero-content` is the artwork's
rectangle inside that file (`left: calc(100% * 106 / 1053); width: calc(100% *
841 / 1053)`), and the hotspots are percentages of it. From 9:16 upward the
screen is wider still, so the poster is shown whole — framed, rounded, with a
soft shadow — and a blurred copy of itself fills the sides.

The homepage is `h-svh`, `overflow-hidden`, with no section after it — the
document has exactly one viewport of height and nothing scrolls.

### Menu and info panels

`Menu` (Home, About, Benefits, Ingredients + a gold *Order now* button) is a
right-hand panel; About / Benefits / Ingredients open a centred card over the
hero. Both share one overlay state in `hero.tsx`:

- CSS transitions (0.3–0.42 s), entering **and** leaving; nothing unmounts until
  the exit transition has played.
- close button (focused on open), backdrop click, and `Escape`.
- focus returns to the control that opened the overlay.
- `role="dialog"` + `aria-modal`, 44 px touch targets.

---

## The order flow

`app/order/page.tsx` (server) reads the product and passes it to
`app/order/order-form.tsx` (client). The form collects **only** name, mobile
number and delivery address, plus a quantity stepper (1–10, default 1).

- No payment method, no delivery charge, no courier choice, no card fields.
- A price row appears **only** when `PRODUCT_PRICE_BDT` is set. Nothing invents
  a price.
- The success screen appears only after `POST /api/orders` returns an
  `orderRef` — i.e. after the row is written. Failures show the error and keep
  the filled-in form.
- The submit button disables while in flight and the confirmation replaces the
  form, so a second submission is not possible from the UI. The client also
  sends a `submissionId`; retrying it returns the same order instead of a
  duplicate.

### Validation (`lib/validation.ts`, shared by browser and server)

| field    | rule                                                              |
| -------- | ----------------------------------------------------------------- |
| name     | 2–80 characters, whitespace collapsed                             |
| mobile   | Bangladesh: `01[3-9]` + 8 digits; `+880…`, `880…`, `88…`, spaces and dashes are normalised |
| address  | 10–500 characters, newlines/notes allowed                         |
| quantity | integer, 1–10                                                     |

### `POST /api/orders` (`app/api/orders/route.ts`)

1. same-origin check (`Origin`/`Sec-Fetch-Site`) → 403
2. in-memory rate limit, 6 per 10 min per IP → 429
3. body size guard (8 KB), honeypot field, and a minimum fill time
4. idempotency: an already-used `submissionId` returns its existing order
5. one order per phone number per 60 s → 429
6. shared validation → 422 with per-field messages
7. write → 201 `{ orderRef }`; storage errors → 500 with no false success

Order references look like `ISMOT-7ZHAQ` (5 chars from an alphabet without
`0/O/1/I`) and are unique in the database.

---

## Storage

One interface in `lib/orders.ts`, two backends:

- **Supabase** when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set.
  Table `public.orders` from `supabase/schema.sql`; RLS enabled with **no
  policies**, so only the service role (server) can read or write. The key is
  never sent to the browser.
- **SQLite** (`node:sqlite`) otherwise, at `.data/orders.db`. Convenient for
  local work; **it will not survive on serverless hosting** (no persistent
  disk), so production must use Supabase.

Every order stores: id, order reference, customer name, phone, address,
product, size, quantity, status, and a creation timestamp.

---

## Admin (`/admin`)

Protected by `ADMIN_PASSWORD`. The session cookie is an HMAC-signed, expiring
token (`httpOnly`, `sameSite=lax`, `secure` in production), never the password.
Login is rate-limited (5 attempts / 10 min). With no `ADMIN_PASSWORD` set the
area reports that it is not configured instead of opening.

The page lists orders newest-first (table on desktop, cards on mobile), with
**Pending / Confirmed / Processing / Delivered / Cancelled** per order, and
**Export .xlsx** → `/api/admin/export`, a real ExcelJS workbook with columns
Order ID, Customer Name, Phone Number, Delivery Address, Product, Size,
Quantity, Order Date, Status.

> There is no Microsoft/OneDrive workbook integration — no credentials are
> configured, and nothing pretends otherwise. The export above is the
> spreadsheet path: the database is the system of record.

---

## Environment

| variable | required | purpose |
| -------- | -------- | ------- |
| `ADMIN_PASSWORD` | for `/admin` | staff login |
| `ADMIN_SESSION_SECRET` | optional | cookie signing (defaults to the password) |
| `SUPABASE_URL` | production | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | production | server-only key (never expose) |
| `PRODUCT_PRICE_BDT` | optional | shows price/total; hidden when unset |
| `ORDERS_DB_PATH` | optional | SQLite file path (default `.data/orders.db`) |

Secrets live in `.env.local` (git-ignored) or the host's environment settings.

---

## Layout of the app

```
ismot-next/
├── app/
│   ├── page.tsx            → <Hero />                       (route /)
│   ├── hero.tsx            → poster + real controls + overlays
│   ├── wordmark.tsx        → text "Ismot / HAIR OIL" lockup
│   ├── template.tsx        → per-navigation fade
│   ├── layout.tsx          → fonts (Geist + Cormorant), metadata
│   ├── globals.css         → Tailwind v4 import + brand tokens + hero/order CSS
│   ├── order/page.tsx      → checkout shell
│   ├── order/order-form.tsx→ form, validation, confirmation
│   ├── admin/page.tsx      → order management
│   ├── admin/actions.ts    → login / logout / status server actions
│   ├── api/orders/route.ts → POST order
│   └── api/admin/export/route.ts → .xlsx
├── lib/
│   ├── product.ts          → the single product + optional price
│   ├── validation.ts       → shared field rules
│   ├── orders.ts           → storage (Supabase | SQLite)
│   ├── admin-auth.ts       → password + signed session cookie
│   └── rate-limit.ts       → fixed-window limiter
├── public/                 → hero-phone-bleed.webp, bottle.webp
└── supabase/schema.sql
```

`app/gsap.ts` and the GSAP dependencies are left over from the earlier
scroll-scrubbed hero and are no longer imported by any route.

---

## Deployment

`ismot-next/` is a standard Next.js 16 app, so Vercel works with that directory
as the project root. Before going live:

1. Set `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY` (and `PRODUCT_PRICE_BDT` if you have a price).
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Place one test order end-to-end and confirm it appears in `/admin` and in the
   export.

The hero depends on `svh` units and `min()`/`aspect-ratio`; check it on a real
phone, not only a resized desktop window.

---

## Legacy material

`index.html`, `app.js`, `styles.css`, `assets/` and `vendor/` at the repo root are
the **pre-framework v1 site**. They are kept for reference (the layer artwork
manifest in `assets/layers.js` is where the hotspot percentages come from) and
are not part of the Next.js app.

`vera/`, `vera_assets_zip/`, `video_frames/` and `tools/` are design and
measurement reference only. Nothing in `ismot-next/` imports from them.

Git: this repo auto-commits and pushes (`.githooks/post-commit`,
`tools/autosave.mjs`, VS Code smart commit) — see `AGENTS.md`.
