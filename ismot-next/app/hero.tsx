"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Wordmark from "./wordmark";

/**
 * Homepage — the promotional artwork, full screen and nothing else.
 *
 * Everything the visitor can see is painted into one 2477x3264 poster, so the
 * hero renders that poster at its own aspect ratio and covers each painted
 * control with a real button. The boxes below are percentages of the poster,
 * measured from the artwork's own layer manifest, so the hit areas stay on the
 * painted pixels at every viewport size.
 *
 * The artwork is shown whole (never cropped): on phones it fills the width, on
 * desktop it fills the height, and a blurred copy of itself fills the rest of
 * the screen with the same forest/gold palette.
 */

type Box = { left: number; top: number; width: number; height: number };

/* Measured from the poster. Slightly larger than the painted control so touch
   targets are usable, but never overlapping: the bag and menu icons sit right
   next to each other, so their boxes meet at 92.75%. */
const HOTSPOTS = {
  order: { left: 37, top: 91.2, width: 30.8, height: 8.8 },
  bag: { left: 85.6, top: 0, width: 7.15, height: 8 },
  menu: { left: 92.75, top: 0, width: 6.9, height: 8 },
  logo: { left: 0.4, top: 0, width: 14.9, height: 8 },
  about: { left: 23.6, top: 0, width: 12.4, height: 8 },
  benefits: { left: 40.1, top: 0, width: 14.9, height: 8 },
  ingredients: { left: 58.2, top: 0, width: 18.6, height: 8 },
} satisfies Record<string, Box>;

const boxStyle = (box: Box) => ({
  left: `${box.left}%`,
  top: `${box.top}%`,
  width: `${box.width}%`,
  height: `${box.height}%`,
});

type PanelKey = "about" | "benefits" | "ingredients";
type OverlayKey = PanelKey | "menu";

const PANELS: Record<
  PanelKey,
  { eyebrow: string; title: string; intro: string; points?: { title: string; body: string }[]; note?: string }
> = {
  about: {
    eyebrow: "Our story",
    title: "Rooted in nature",
    intro:
      "Ismot began with one belief: healthy hair should not need a shelf of chemicals. It needs good oil, pressed from good plants.",
    points: [
      {
        title: "One bottle, done properly",
        body: "A single 100 ml spray of naturally sourced herbal oil — light enough for every day, rich enough to make a difference.",
      },
      {
        title: "Made for real routines",
        body: "Spray it on, massage it in, leave it or wash it out. No complicated regimes, no ten-step rituals.",
      },
    ],
    note: "100% natural · No parabens · No silicones · Cruelty free",
  },
  benefits: {
    eyebrow: "What it does",
    title: "For stronger, shinier hair",
    intro:
      "The blend is built to do the simple things exceptionally well — the way a good hair oil should.",
    points: [
      {
        title: "Stronger, healthier-looking hair",
        body: "A daily botanical oil that helps hair look and feel fuller, softer and less brittle.",
      },
      {
        title: "Shine without the grease",
        body: "Absorbs quickly, so hair stays light and soft instead of slick.",
      },
      {
        title: "A calmer, happier scalp",
        body: "Spray directly at the roots and massage in — the mist reaches the scalp instead of pooling in your hands.",
      },
      {
        title: "Made for every hair type",
        body: "Straight, wavy, curly or coily. One bottle suits them all.",
      },
    ],
    note: "For all hair types · 100 ml pure hair care",
  },
  ingredients: {
    eyebrow: "Inside the bottle",
    title: "Botanical, by design",
    intro:
      "Hibiscus, coconut, rosemary and almond — the botanicals arranged around the bottle on our label — are the heart of the blend.",
    points: [
      {
        title: "Nothing hidden",
        body: "100% natural. No parabens, no silicones, and never tested on animals.",
      },
      {
        title: "Cold, light, fast-absorbing",
        body: "A fine mist of pure hair care that reaches the scalp and spreads evenly through the strand.",
      },
    ],
    note: "The full ingredient list is printed on every bottle.",
  },
};

/* "Order Now" is the gold button at the foot of the panel rather than a list
   row, so the conversion path is always the loudest thing on screen. */
const MENU_NAV: { label: string; action: "home" | PanelKey }[] = [
  { label: "Home", action: "home" },
  { label: "About", action: "about" },
  { label: "Benefits", action: "benefits" },
  { label: "Ingredients", action: "ingredients" },
];

export default function Hero() {
  const [mounted, setMounted] = useState<OverlayKey | null>(null);
  const [entered, setEntered] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const closeButton = useRef<HTMLButtonElement | null>(null);

  const clearCloseTimer = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openOverlay = useCallback((key: OverlayKey) => {
    clearCloseTimer();
    setMounted(key);
    if (mounted === null) {
      setEntered(false);
      // Two frames: let the closed state paint before transitioning in.
      requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    }
  }, [mounted]);

  const closeOverlay = useCallback(() => {
    clearCloseTimer();
    setEntered(false);
    closeTimer.current = window.setTimeout(() => setMounted(null), 340);
  }, []);

  useEffect(() => () => clearCloseTimer(), []);

  useEffect(() => {
    if (!mounted) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => closeButton.current?.focus(), 80);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeOverlay();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [mounted, closeOverlay]);

  const panel = mounted && mounted !== "menu" ? PANELS[mounted] : null;

  return (
    <main className="hero-root flex h-svh w-full items-center justify-center overflow-hidden">
      <div className="hero-backdrop" aria-hidden="true" />
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-scrim" aria-hidden="true" />

      <div className="hero-poster">
        <Image
          src="/hero-1600.webp"
          alt="Ismot Hair Oil — a 100 ml bottle of golden herbal hair oil on a stone plinth, surrounded by hibiscus, rosemary and almond, beneath a large Ismot wordmark, with labels reading 100% natural ingredients and 100 ml pure hair care."
          fill
          priority
          sizes="(max-width: 900px) 100vw, 50vw"
          className="hero-art"
        />

        {/* Real controls, placed exactly over the painted ones. */}
        <Link
          href="/order"
          className="hero-hit hero-hit--pill"
          style={boxStyle(HOTSPOTS.order)}
          aria-label="Order Ismot Hair Oil now"
        />

        <Link
          href="/order"
          className="hero-hit"
          style={boxStyle(HOTSPOTS.bag)}
          aria-label="Shopping bag — order Ismot Hair Oil"
        >
          <span className="sr-only">Shopping bag</span>
        </Link>

        <button
          type="button"
          className="hero-hit"
          style={boxStyle(HOTSPOTS.menu)}
          onClick={() => openOverlay("menu")}
          aria-label="Open menu"
          aria-expanded={mounted !== null}
          aria-haspopup="dialog"
        />

        <Link
          href="/"
          className="hero-hit"
          style={boxStyle(HOTSPOTS.logo)}
          aria-label="Ismot Hair Oil — home"
        />

        <button
          type="button"
          className="hero-hit"
          style={boxStyle(HOTSPOTS.about)}
          onClick={() => openOverlay("about")}
          aria-haspopup="dialog"
        >
          <span className="sr-only">About Ismot</span>
        </button>

        <button
          type="button"
          className="hero-hit"
          style={boxStyle(HOTSPOTS.benefits)}
          onClick={() => openOverlay("benefits")}
          aria-haspopup="dialog"
        >
          <span className="sr-only">Benefits</span>
        </button>

        <button
          type="button"
          className="hero-hit"
          style={boxStyle(HOTSPOTS.ingredients)}
          onClick={() => openOverlay("ingredients")}
          aria-haspopup="dialog"
        >
          <span className="sr-only">Ingredients</span>
        </button>
      </div>

      {mounted && (
        <div className="overlay" data-open={entered} role="dialog" aria-modal="true">
          <button
            type="button"
            className="overlay__backdrop"
            onClick={closeOverlay}
            tabIndex={-1}
            aria-label="Close"
          />

          {mounted === "menu" ? (
            <div className="side-panel" role="document">
              <div className="flex items-center justify-between border-b border-gold/20 px-6 py-5">
                <Wordmark />
                <button
                  ref={closeButton}
                  type="button"
                  onClick={closeOverlay}
                  className="flex size-11 items-center justify-center rounded-full border border-gold/40 text-gold-soft transition-colors hover:bg-gold/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft"
                  aria-label="Close menu"
                >
                  <CloseIcon />
                </button>
              </div>

              <nav aria-label="Menu" className="flex flex-1 flex-col justify-center px-6 py-8">
                <ul className="space-y-1">
                  {MENU_NAV.map((item, index) => {
                    // Bind first: a property narrowed through a closure is not
                    // narrowed for TypeScript (or for the reader).
                    const action = item.action;
                    return (
                      <li key={item.label}>
                        {action === "home" ? (
                          <Link
                            href="/"
                            onClick={closeOverlay}
                            className="group flex items-baseline gap-4 rounded-2xl px-3 py-3.5 transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft"
                          >
                            <span className="text-[11px] font-semibold tabular-nums tracking-[0.2em] text-gold/60">
                              0{index + 1}
                            </span>
                            <span className="overlay-title text-3xl text-cream transition-colors group-hover:text-gold-soft">
                              {item.label}
                            </span>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openOverlay(action)}
                            className="group flex w-full items-baseline gap-4 rounded-2xl px-3 py-3.5 text-left transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft"
                          >
                            <span className="text-[11px] font-semibold tabular-nums tracking-[0.2em] text-gold/60">
                              0{index + 1}
                            </span>
                            <span className="overlay-title text-3xl text-cream transition-colors group-hover:text-gold-soft">
                              {item.label}
                            </span>
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="border-t border-gold/20 px-6 py-6">
                <Link
                  href="/order"
                  className="btn-gold w-full"
                  onClick={closeOverlay}
                >
                  Order now
                  <ArrowIcon />
                </Link>
                <p className="mt-4 text-center text-[11px] uppercase tracking-[0.22em] text-sage/70">
                  100 ml · Naturally sourced
                </p>
              </div>
            </div>
          ) : (
            panel && (
              <div className="info-panel" role="document">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold/80">
                      {panel.eyebrow}
                    </p>
                    <h2
                      id="overlay-title"
                      className="overlay-title mt-3 text-[clamp(1.75rem,5vw,2.35rem)] text-cream"
                    >
                      {panel.title}
                    </h2>
                  </div>
                  <button
                    ref={closeButton}
                    type="button"
                    onClick={closeOverlay}
                    className="-mr-1 -mt-1 flex size-10 shrink-0 items-center justify-center rounded-full border border-gold/35 text-gold-soft transition-colors hover:bg-gold/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft"
                    aria-label="Close"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <p className="mt-4 text-[15px] leading-relaxed text-cream/80">{panel.intro}</p>

                {panel.points && (
                  <ul className="mt-6 space-y-4">
                    {panel.points.map((point) => (
                      <li key={point.title} className="flex gap-3">
                        <span className="mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-gold/40 text-gold">
                          <LeafIcon />
                        </span>
                        <div>
                          <h3 className="text-[13px] font-bold uppercase tracking-[0.08em] text-gold-soft">
                            {point.title}
                          </h3>
                          <p className="mt-1 text-sm leading-relaxed text-cream/70">{point.body}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {panel.note && (
                  <p className="mt-6 rounded-xl border border-gold/20 bg-gold/[0.06] px-4 py-3 text-[11px] font-semibold uppercase leading-relaxed tracking-[0.14em] text-gold-soft/90">
                    {panel.note}
                  </p>
                )}

                <Link href="/order" className="btn-gold mt-7 w-full" onClick={closeOverlay}>
                  Order now
                  <ArrowIcon />
                </Link>
              </div>
            )
          )}
        </div>
      )}
    </main>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}
