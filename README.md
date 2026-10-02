# Ismot — Natural Hair Oil Website

Marketing site for **Ismot**, a natural hair-oil brand. The brand look is a deep
forest green palette on a soft light-green stage, with a tilted amber bottle
sitting on a pale disc and a huge faded `ISMOT` watermark behind it.

The repo is a **single Next.js app** plus the design/measurement material that
produced it. The hero is the only finished section so far; the rest of the site
is still to be built.

---

## Quick start

```bash
cd ismot-next
npm install
npm run dev
```

`next dev` picks a free port (it prints `- Local: http://localhost:XXXXX`) —
it is **not always 3000**, so read the line rather than assuming.

Other scripts, run from `ismot-next/`:

| command         | what it does                              |
| --------------- | ----------------------------------------- |
| `npm run dev`   | dev server with Turbopack + hot reload    |
| `npm run build` | production build                          |
| `npm run start` | serve the production build                |
| `npm run lint`  | ESLint (`eslint-config-next`)             |

Type-checking is `npx tsc --noEmit` — also from `ismot-next/`.

---

## Repository layout

```
.
├── README.md                  ← this file
├── AGENTS.md                  ← working rules for AI agents
├── .gitignore  .gitattributes
│
├── index.html  app.js  styles.css   ┐ legacy static site (v1) — see below
├── assets/                          │
├── vendor/                          ┘
│
├── ismot-next/                ★ THE ACTIVE APP
│   ├── app/
│   │   ├── page.tsx           → renders <Hero />
│   │   ├── layout.tsx         → metadata, fonts ("Ismot")
│   │   ├── hero.tsx           → the entire hero: markup + GSAP timeline
│   │   ├── gsap.ts            → the single GSAP registration point
│   │   ├── globals.css        → Tailwind v4 import + hero sizing rules
│   │   └── favicon.ico
│   ├── public/                → bottle.webp, circle-white.webp,
│   │                            product-hd.webp, hero-bg.jpg
│   ├── package.json
│   └── next.config.ts  tsconfig.json  eslint.config.mjs  postcss.config.mjs
│
├── tools/                     → python measurement scripts + autosave watcher
├── vera/                      → VERA Skin template, kept for reference only
├── vera_assets_zip/           → 26 ezgif frames (animation reference)
└── video_frames/              → 8 frames (animation reference)
```

**Everything that ships lives in `ismot-next/`.** Everything else is either
reference material or the previous generation of the site.

---

## Tech stack

- **Next.js 16.3.8** — App Router, Turbopack, TypeScript
- **React 19**
- **Tailwind CSS v4** (CSS-first config: `@import "tailwindcss"` in
  `globals.css`; there is **no `tailwind.config.js`**)
- **GSAP 3.15** + `@gsap/react` (`useGSAP`), ScrollTrigger

Adding a dependency? Prefer what is already here. GSAP is registered once, in
`app/gsap.ts` — import `gsap`, `ScrollTrigger` and `useGSAP` from there and
nowhere else.

---

## Design system

### Palette

| role                    | hex       | notes                        |
| ----------------------- | --------- | ---------------------------- |
| headline / deep green   | `#243d14` | `h1`, primary display text   |
| body / sage             | `#57734a` | paragraphs, labels           |
| nav links               | `#3a5a2a` | hover `#1e3512`              |
| buttons, divider rule   | `#3e6427` | filled hover `#32511e`       |
| feature icon circles    | `#4a7031` | border + icon stroke         |
| watermark               | `white/20`| the giant faded `ISMOT`      |

### The two CSS variables that drive the hero

Both live in `app/globals.css` and are documented inline there. In short:

- `.hero-scene` defines `--stage`, `--stage-top` and `--band-top`. `--stage` is
  the size of the square composition and is capped by the *bottle's real ink
  footprint* (measured at its 12° tilt) rather than its bounding box, so the
  bottle only ever shrinks by as much as a short window truly forces.
- `.hero-stage` is absolutely positioned and centred with auto margins — **not**
  with a transform — because a transform would create a stacking context and the
  bottle could then never sit above the copy.

Cosmetic and layout constants are intentionally concentrated in these two rules
plus `hero.tsx`. Nothing arbitrary is duplicated into components.

---

## The hero (`app/hero.tsx`)

A four-beat intro, **driven by scroll** rather than a timer:

1. An empty light-green stage.
2. The bottle drops in from above the fold under gravity easing, squashes,
   hops a few pixels and settles.
3. As it lands the copy emerges **from behind the bottle** — headline first,
   then the buttons, then the right-hand column — while the `ISMOT` watermark
   breathes in behind everything.
4. The nav fades and slides down once the bottle has landed.

Scrolling *back up* rewinds the whole thing; it is a scroll-scrubbed timeline,
not a one-shot.

### How it is wired

- `<section class="hero h-[250svh]">` provides the scroll runway;
  `<div class="hero-scene sticky top-0 h-svh">` is the pinned stage. **CSS
  `position: sticky` is used instead of ScrollTrigger's `pin: true`** — `pin`
  builds a pin-spacer, which collapses to a single viewport under the
  `body { display: flex }` layout in `layout.tsx` and leaves the document with
  no scroll range at all.
- One timeline: `gsap.timeline({ defaults: { ease: "power3.out" }, scrollTrigger: { trigger, start: "top top", end: "bottom bottom", scrub: 0.6 } })`.
- Elements are tagged with `data-anim="…"` attributes (`line`, `cta`, `media`,
  `feature`, `watermark`, `nav`, `bottle`, `bottle-art`). The timeline selects
  by attribute, so the markup stays readable.
- Initial states are set with `gsap.set` **before paint**, and each is also
  given an `opacity-0` utility class as FOUC insurance.

### Two gotchas that must not regress

These cost real debugging time. Read them before touching the hero.

**1. GSAP folds CSS `translate`/`rotate`/`scale` into its own `transform`.** On
its first write GSAP takes ownership of the element's transform and sets
`translate: none`. The copy sits on a "guide rail" built from Tailwind step
offsets (CSS `translate`), so a plain absolute `x` target **erases the rail**.
Fix: read each element's resting offset with `gsap.getProperty(el, "x")` — *not*
`getComputedStyle(el).translate`, which in Chromium returns an unresolved
`calc()` that silently parses as `0` — store it in a `rail` map, and animate to
`x: railX` using a function-based value.

**2. The bottle's transform is owned by GSAP, not by CSS classes.** The bottle
image must carry `xPercent: -50, yPercent: -50, rotation: 12` as a
`gsap.set(...)` in the effect, **not** `-translate-x-1/2 -translate-y-1/2
rotate-[12deg]` classes. And `invalidateOnRefresh: true` must stay **off** the
scrollTrigger: on refresh it re-parses the transform, reads zero, and silently
drops both the centring and the tilt (the bottle drifts ~86 px off the orb).

Both are also called out in comments at the point of use.

### Dev-only handles

In development the timeline and its ScrollTrigger are exposed as
`window.heroTl` and `window.heroST`. Useful for measuring the live DOM rather
than eyeballing a screenshot — background-tab `requestAnimationFrame` is
throttled, so **verify by measuring elements, not by looking**.

---

## Legacy static site (v1)

`index.html`, `app.js`, `styles.css` at the repo root — together with `assets/`
(layer images + `layers.js`) and `vendor/` (GSAP, ScrollTrigger, Lenis) — are
the **first, non-framework version** of the site. It is self-contained: open
`index.html` in a browser and it runs.

It is kept for reference (it holds the original layer-based artwork) but it is
**not** part of the Next.js app and is not deployed. New work goes in
`ismot-next/`.

---

## Reference material

Kept because it documents where the design came from:

- `vera/` — the VERA Skin template (`index.html`, `styles.css`, `app.js`), used
  as a starting point. It has **no drop animation**; the filmed frames were the
  animation reference instead.
- `vera_assets_zip/` — 26 extracted frames of the reference animation.
- `video_frames/` — 8 further frames from the same reference clip.
- `tools/` — the Python measurement scripts that produce the numbers the hero's
  CSS is derived from (`ink_profile.py`, `orb_profile.py`, `stage_fit.py`, …),
  plus the debug overlays they generated. Requires `Pillow` and `numpy`
  (**scipy is not installed**).

These are reference inputs, not build inputs. Nothing in `ismot-next/` imports
from them.

---

## Git workflow & auto-save

The repo is mirrored to
**<https://github.com/sifaaaaaaaat/ismot>**.

Three independent mechanisms keep it in sync — see `AGENTS.md` for the rules
agents must follow:

1. **`.githooks/post-commit`** — every commit is pushed to `origin`
   automatically. Enabled by the repo-local setting
   `core.hooksPath = .githooks`.
2. **`tools/autosave.mjs`** — a file watcher that commits and pushes after the
   tree has been quiet for a while:

   ```bash
   node tools/autosave.mjs            # 15s debounce
   AUTOSAVE_DEBOUNCE_MS=30000 node tools/autosave.mjs
   ```

3. **`.vscode/settings.json`** — smart commit + push-after-commit, so committing
   from the editor's Source Control panel syncs too.

Run `git config core.hooksPath` to confirm the hook is active. To silence the
auto-push temporarily, `git commit --no-verify` (hooks are skipped) or unset
`core.hooksPath`.

---

## Deployment

Not configured yet. The app is a standard Next.js project in `ismot-next/`, so
Vercel works out of the box if you set that directory as the project root
(`ismot-next`). Remember the hero relies on `svh` units and `position: sticky`;
test on real mobile browsers, not just a resized desktop window.

### Known gap

Below roughly **1100 px** of viewport width the two hero copy columns collide
with the bottle — no stage size fixes it, the columns themselves run out of
room. That range needs a stacked layout, which has not been built yet.
