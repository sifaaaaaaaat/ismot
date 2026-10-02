# AGENTS.md — working rules for this repository

`README.md` explains *what* this project is. This file explains *how to work in
it*. Read both before making changes.

## 1. Where the code is

**All application code lives in `ismot-next/`.** That is the Next.js 16 app
(App Router, TypeScript, Tailwind v4, GSAP).

The root-level `index.html`, `app.js`, `styles.css`, `assets/` and `vendor/`
are the **previous, pre-framework version** of the site, kept for reference
only. Do not extend them and do not wire them into the Next app.

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

`npm run lint` currently reports **3 `@next/next/no-img-element` warnings**.
Those are intentional — the hero artwork must stay plain `<img>` elements so
GSAP can transform them. Do not "fix" them into `next/image`.

## 3. Hard constraints on the hero

- **The headline and body copy must remain real HTML text.** Never rasterise
  copy into an image — GSAP animates it and it must stay selectable and
  accessible.
- **Do only what was asked.** This hero is tuned to a specific approved
  composition. Prefer the smallest change that achieves the request over a
  refactor.
- **Measure, do not eyeball.** Background-tab `requestAnimationFrame` and timers
  are throttled, so screenshots lie. Verify layout by reading the live DOM
  (`getBoundingClientRect`, `gsap.getProperty`) — the dev-only handles
  `window.heroTl` / `window.heroST` are there for that.
- The design size the composition is tuned to is **1280 × 960**. Any change
  must leave that size byte-for-byte identical.

## 4. Two GSAP gotchas that must not regress

Both are documented in full in `README.md` and at the point of use in
`hero.tsx`. The short version:

1. GSAP folds CSS `translate`/`rotate`/`scale` into its own `transform` on
   first write. The copy's "guide rail" is made of CSS step offsets, so read
   resting positions with `gsap.getProperty(el, "x")` and animate to those
   function-based values — never `getComputedStyle(el).translate`, which
   returns an unresolved `calc()` that parses as `0`.
2. The bottle's transform belongs to GSAP (`gsap.set(..., { xPercent: -50,
   yPercent: -50, rotation: 12 })`), not to Tailwind classes, and
   `invalidateOnRefresh` must stay **off** the scrollTrigger — on refresh it
   re-parses the transform as zero and drops the centring and the tilt.

## 5. Style and conventions

- Match the surrounding code. There is **no Prettier** configured (only ESLint),
  so re-indent by hand when restructuring JSX.
- Tailwind v4 is configured **in CSS** (`app/globals.css`). There is no
  `tailwind.config.js`; do not create one.
- Import GSAP only through `app/gsap.ts`, which registers ScrollTrigger and
  `useGSAP` once.
- Layout and cosmetic constants are deliberately centralised in the
  `.hero-scene` / `.hero-stage` rules and in `hero.tsx`. Put new constants
  there rather than sprinkling magic numbers through components.
- Tailwind v4 emits `rotate` and `translate` as **separate CSS properties**,
  not as `transform`. Read them with `getComputedStyle(el).rotate` /
  `.translate` — but see gotcha 1 before you write to them.

## 6. Committing — the repo auto-pushes

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
- Never commit or push without explicit user intent to do so *only* if the user
  has asked you to stop — otherwise the standing instruction is to keep the repo
  in sync.
- Keep build output out of the history: `.gitignore` covers `node_modules/`,
  `.next/`, `*.log`, `*.tsbuildinfo`, `.env*` and `.freebuff/`. Do not bypass it.
- Write commit messages that state **why**, in the imperative mood.

## 7. Known gaps

- **Hero below ~1100 px width** — the two copy columns collide with the bottle.
  No stage size resolves it; that range needs a stacked layout.
- **Very wide windows** — copy is anchored 44 px from the left edge while the
  bottle is centred, so the "emerges from behind the bottle" illusion weakens
  (≈380 px gap at 1900 px wide).
- Only the hero exists. Nav links, buttons and the rest of the page are
  currently non-functional markup.
