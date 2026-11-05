# AGENTS.md — working rules for this repository

`README.md` explains *what* this project is. This file explains *how to work in
it*. Read both before making changes.

## 1. Where the code is

**All application code lives in `ismot-next/`.** That is the Next.js 16 app
(App Router, TypeScript, Tailwind v4). It is the whole site; there is no other
version of it in the repository.

`assets/` holds only the three artwork masters (`ismot-hero-phone.png`,
`ismot-botanicals.png`, `ismot-benefits.png`), which `tools/build_hero_asset.py`
encodes into `ismot-next/public/`. Nothing in `ismot-next/` imports from
`assets/` or `tools/` — they are inputs to the build, not to the app.

## 2. Run and verify

```bash
cd ismot-next
npm install
npm run dev          # read the printed port; it is not always 3000

npx tsc --noEmit     # type-check — run after every edit
npm run lint         # ESLint
npm run build        # production build
```

`npm run lint` and `npx tsc --noEmit` are expected to be clean. Do not silence a
warning just to make them pass.

## 3. Hard constraints on the homepage

- **The homepage is the client's three posters, stacked in order.** The hero
  fills exactly one viewport (`h-svh`, `overflow-hidden`), then the botanical
  ingredients sheet, then the benefits sheet — all three 841 × 1870, all shown
  as painted. Nothing else: no footer, no testimonials, product grid, written
  section or blank spacer. The two sheets below the hero are taller than a
  phone screen, so the page scrolls; the hero itself must never.
- **Every painted control keeps a real control on top of it.** The boxes in
  `HOTSPOTS` (`app/hero.tsx`) are percentages of `.hero-content` — the painted
  9:16 poster — and only line up because that element is exactly the artwork's
  rectangle. The benefits sheet's painted "Buy Now" is covered the same way:
  its box is a percentage of `.poster-frame` in `app/page.tsx`. If the artwork
  or a control moves, re-measure — do not nudge pixels until it "looks right".
- The bag and menu hit boxes sit close together (≈75.8 % and ≈84.4 % across);
  they must never overlap, or the wrong control receives the tap.
- **Cover the screen, never fill it with blur.** The artwork is 841 × 1870
  (about 9:20) and is served as painted (`public/hero-phone.webp`, re-encoded by
  `tools/build_hero_asset.py`). A phone is a little wider, so the poster box keeps
  the artwork's ratio, is sized `width: max(100vw, 100svh * 841 / 1870)` with
  `flex: none`, and is zoomed until it covers the viewport: no band, and only a
  few pixels of the artwork's outer margin are clipped at the top and bottom.
  Do not add a blurred or mirrored extension down the sides — the brand asked for
  the zoom instead. `.hero-content` is the artwork's rectangle and every hotspot
  is a percentage of it. From 9:16 upward the poster is shown whole and framed
  on the plain dark ground.
- **The two sheets below the hero are never cropped or zoomed.** They are shown
  whole at the artwork's ratio: full width on a phone, and on a desktop they
  follow the hero's own width and framing (`min(100%, calc(100svh * 841 / 1870),
  841px)`, rounded, on the plain dark ground) so all three posters read as one
  column (`.poster-section` / `.poster-frame` / `.poster-art` in
  `app/globals.css`, rendered by `app/poster.tsx`). Source masters are
  `assets/ismot-botanicals.png` and `assets/ismot-benefits.png`; the same script
  encodes them to `public/botanicals.webp` and `public/benefits.webp`.
- Info panels are overlays over the hero, not new page sections.

## 4. Hard constraints on ordering

- The form collects **only** full name, mobile number and delivery address.
  Never add payment fields, delivery charges, shipping options, courier
  selection or extra personal data.
- **Never invent a price.** Price comes from `PRODUCT_PRICE_BDT` and every price
  row is hidden when it is unset.
- Orders go through `POST /api/orders` only. Keep validation shared via
  `lib/validation.ts`, keep the same-origin / rate-limit / honeypot /
  idempotency checks, and never show the confirmation screen unless the backend
  actually returned an `orderRef`.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` (or any secret) to the client. Customer
  data is admin-only: `/admin` requires `ADMIN_PASSWORD` and the export route
  checks the session.
- `.data/` holds real customer rows in development. It is git-ignored — keep it
  that way, and never commit an order database or an export.

## 5. Order statuses

`Pending`, `Confirmed`, `Processing`, `Delivered`, `Cancelled` — defined once in
`lib/orders.ts` and enforced in the database. Don't add statuses in the UI only.

## 6. Style and conventions

- Match the surrounding code. There is **no Prettier** configured (only ESLint),
  so re-indent by hand when restructuring JSX.
- Tailwind v4 is configured **in CSS** (`app/globals.css`). There is no
  `tailwind.config.js`; do not create one. Brand colours live in `@theme` as
  `forest`, `moss`, `gold`, `gold-soft`, `cream`, `sage`.
- Layout and cosmetic constants are deliberately centralised in the component
  CSS blocks (`.hero-*`, `.overlay*`, `.field`, `.btn-*`) and in `hero.tsx`.
  Put new constants there rather than sprinkling magic numbers through
  components.
- There is no animation library in the app: the hero, overlays and page fade
  are plain CSS. Don't add one for a cosmetic effect.

## 7. Committing — the repo auto-pushes

This repository is mirrored to <https://github.com/sifaaaaaaaat/ismot> and is
set up to stay in sync automatically:

- `.githooks/post-commit` pushes every commit to `origin` (enabled via the
  repo-local `core.hooksPath = .githooks`).
- `tools/autosave.mjs` watches the tree and commits + pushes once it has been
  quiet for 15 s (`node tools/autosave.mjs`).
- `.vscode/settings.json` enables smart commit + push-after-commit.

**Therefore: after a meaningful, verified change, commit it.** Do not leave
finished work as an uncommitted diff — it will be swept into an automatic
commit with a vague message, which is worse for history.

Guidelines:

- Commit only files you changed. Never `git add -A` across someone else's
  in-progress work.
- Keep build output out of the history: `.gitignore` covers `node_modules/`,
  `.next/`, `*.log`, `*.tsbuildinfo`, `.env*`, `.data/` and `.freebuff/`. Do not
  bypass it.
- Write commit messages that state **why**, in the imperative mood.

## 8. Known gaps

- Ingredient and benefit copy in the hero panels is written from the label's
  claims — have the brand confirm the exact formulation before launch.
- There is no Microsoft/OneDrive workbook integration; `/admin` + the `.xlsx`
  export is the order-management path.
- No password reset, no email/SMS notification, and no per-customer order
  lookup — orders are confirmed by phone as the confirmation screen says.
