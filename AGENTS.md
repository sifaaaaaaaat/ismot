# AGENTS.md — working rules for this repository

`README.md` explains *what* this project is. This file explains *how to work in
it*. Read both before making changes.

## 1. Where the code is

**All application code lives in `ismot-next/`.** That is the Next.js 16 app
(App Router, TypeScript, Tailwind v4).

The root-level `index.html`, `app.js`, `styles.css`, `assets/` and `vendor/`
are the **previous, pre-framework version** of the site, kept for reference
only. Do not extend them and do not wire them into the Next app. (One thing is
still useful about them: `assets/layers.js` holds the artwork's layer manifest,
which is where the hero hotspot percentages come from.)

`vera/`, `vera_assets_zip/`, `video_frames/` and `tools/` are **reference
inputs** — design history and measurement scripts. Nothing in `ismot-next/`
imports from them.

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

- **The homepage is the artwork and nothing else.** No section below the hero,
  no footer, no testimonials, product grid or blank spacer. The document must be
  exactly one viewport tall (`h-svh`, `overflow-hidden`) and must not scroll.
- **Every painted control keeps a real control on top of it.** The boxes in
  `HOTSPOTS` (`app/hero.tsx`) are percentages of `.hero-content` — the painted
  9:16 poster — and only line up because that element is exactly the artwork's
  rectangle. If the artwork or a control moves, re-measure — do not nudge pixels
  until it "looks right".
- The bag and menu hit boxes sit close together (≈75.8 % and ≈84.4 % across);
  they must never overlap, or the wrong control receives the tap.
- **Show the whole artwork.** The file (`public/hero-2x3.webp`) is 1024 × 2389:
  the painted 2:3 poster with 426 px of blurred scene above and below, generated
  by `tools/build_hero_poster.py` from `assets/ismot-hero-2x3.png`. Phones lay
  that file over the whole screen (`height: 100vw * 2389 / 1024`, clipped evenly
  by the root) so no empty band is left; wider screens crop the added scene away
  and frame the poster at 2:3. Never crop the bottle, the CTA or the labels to
  fill the screen.
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
- `app/gsap.ts` and the GSAP dependencies are leftovers from the previous
  scroll-driven hero and are unused. Don't build new work on them without a
  reason.

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
