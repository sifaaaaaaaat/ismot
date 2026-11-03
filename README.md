# Ismot — Hair Oil Website & Order System

**Ismot Hair Oil** is a single-product store with two customer screens and one
staff screen:

1. **`/`** — the client's three posters: the artwork full screen, then the
   ingredients flat-lay, then the benefits sheet. Nothing else.
2. **`/order`** — name, mobile number and delivery address, then a real
   confirmation with an order reference.
3. **`/admin`** — the shopkeeper's order list, status updates and `.xlsx` export.

There is no cart, no payment step and no delivery charge: an order is a request,
and the team confirms it by phone.

Everything that ships lives in **`ismot-next/`** — its
[README](ismot-next/README.md) has the implementation detail (hero hotspots,
order API, storage, environment variables).

---

## Quick start

```bash
cd ismot-next
npm install
npm run dev        # read the printed port; it is not always 3000
```

Optional, in `ismot-next/.env.local` (see `ismot-next/.env.example`):

```bash
PRODUCT_PRICE_BDT=1250      # omit and no price appears anywhere
ADMIN_PASSWORD=change-me    # required for /admin
SUPABASE_URL=…              # optional: otherwise orders go to local SQLite
SUPABASE_SERVICE_ROLE_KEY=…
```

With no database configured, orders are stored in `ismot-next/.data/orders.db`
(git-ignored) so the whole flow works on a fresh clone. Production should use
Supabase — run `ismot-next/supabase/schema.sql` once, then set the two variables
above. The service-role key is server-only and is never sent to the browser.

---

## How the homepage works

The hero is one 941 × 1671 poster. Every control in it is painted into the
image, so the page renders the poster at its own aspect ratio and places **real
buttons over the painted controls**, positioned as percentages of the poster
(`HOTSPOTS` in `ismot-next/app/hero.tsx`):

- **Order Now** and the **shopping bag** → `/order`
- **hamburger** → menu panel (Home, About, Benefits, Ingredients, Order now)
- **About / Benefits / Ingredients** → information overlays over the hero
- **logo** → `/`

The hero poster is zoomed until it covers a phone screen (no bands, no blurred
filler); on a screen wider than 9:16 it is shown whole, framed on the plain dark
ground. The two sheets below it are shown whole at the artwork's own ratio and
the page scrolls through them. The benefits sheet's painted **Buy Now** is a real
link to `/order` as well.

## How ordering works

`POST /api/orders` is the only way an order is created. It checks same-origin,
rate limits, uses a honeypot and a minimum fill time, validates shared rules
(Bangladesh mobile `01[3-9]XXXXXXXX`, 2–80 character name, 10–500 character
address), refuses a second order from the same number within a minute, and
returns the order reference only after the row is written. A repeated
`submissionId` returns the same order instead of a duplicate.

Statuses: **Pending** (initial), Confirmed, Processing, Delivered, Cancelled.

---

## Repository layout

```
.
├── ismot-next/                ★ the Next.js app (all shipping code)
│   ├── app/                   routes: /, /order, /admin, /api/*
│   ├── lib/                   product, validation, storage, admin auth
│   ├── public/                the poster artwork + bottle
│   └── supabase/schema.sql    orders table + RLS
│
├── index.html  app.js  styles.css   ┐ legacy static site (v1) — reference only
├── assets/                          │  layers.js keeps the artwork manifest
├── vendor/                          ┘
│
├── tools/                     measurement scripts + autosave watcher
├── vera/  vera_assets_zip/  video_frames/   design reference only
└── AGENTS.md                  working rules for agents in this repo
```

Nothing in `ismot-next/` imports from the legacy folder or the reference
material.

---

## Deployment

`ismot-next/` is a standard Next.js 16 app; Vercel works with that directory as
the project root. Before going live, set `ADMIN_PASSWORD`,
`ADMIN_SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (and
`PRODUCT_PRICE_BDT` if there is a price), run the Supabase schema, and place one
test order end-to-end.

---

## Git workflow

The repo is mirrored to <https://github.com/sifaaaaaaaat/ismot> and syncs
itself: `.githooks/post-commit` pushes every commit, `tools/autosave.mjs`
commits and pushes after the tree is quiet, and `.vscode/settings.json` does the
same from the editor. See `AGENTS.md`.
