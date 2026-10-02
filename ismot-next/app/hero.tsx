"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "./gsap";

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function DropletIcon({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
    </svg>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

/**
 * Hero — load sequence, four beats (the empty green stage first, like the
 * reference intro):
 *
 *   1. nothing but the light-green background
 *   2. the bottle drops in from above the fold with gravity easing, then
 *      squashes, hops a few pixels and settles
 *   3. as it touches down the copy pops out from behind the bottle — both
 *      columns on the same two beats (headline with the product photo, then
 *      the buttons with the feature rows) so neither side leads the other;
 *      the big ISMOT watermark breathes in behind everything
 *   4. the nav fades/slides down from the top once the bottle has landed
 *
 * Stacking, so the headline really slides out from behind the bottle while the
 * orb stays behind the copy (no z-index flicker mid-tween):
 *   - watermark  z-0
 *   - orb        z-auto inside the stage (the stage sets no z-index, so it does
 *                not create a stacking context)
 *   - copy       z-20
 *   - bottle     z-30 — its own non-rotated layer, so GSAP's y falls straight
 *                down (a y on the tilted image itself would be rotated 12° by
 *                the CSS `rotate` property) while the squash still runs along
 *                the bottle's own axis.
 *   - nav        z-40, above the bottle — the stage is capped (see .hero-stage)
 *                so the two should not meet, but a nav that could be covered by
 *                artwork would be the worse failure of the two.
 */
export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const circle = useRef<HTMLImageElement>(null);
  const bottle = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      /* The bottle's own transform is owned by GSAP rather than by CSS classes.
         GSAP rewrites the transform when it animates and folds the element's CSS
         translate/rotate into its cache once — so any later re-parse of that
         transform (a ScrollTrigger refresh, for instance) reads 0 and silently
         drops the centring and the tilt. Setting them here keeps them stable,
         and it also puts the landing squash in the bottle's own rotated space. */
      gsap.set("[data-anim='bottle-art']", { xPercent: -50, yPercent: -50, rotation: 12 });

      // Motion off: land on the finished frame and collapse the scroll runway —
      // with no scrub to play, the extra height would just be dead scrolling.
      // Only opacity here: the step offsets live in CSS `translate`, and a
      // transform write would erase them.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(root.current, { height: "100svh" });
        gsap.set("[data-anim]", { opacity: 1 }); // includes the bottle layer
        gsap.set(circle.current, { opacity: 0.55 });
        return;
      }

      /* The copy rides a guide rail: the step offsets that make the right edges
         step back as they descend are CSS `translate` values (Tailwind). GSAP
         takes over the transform when it animates, so capture each resting rail
         position once, before anything animates, and treat it as the resting x —
         CSS stays the single source of truth and the reveal travels around it
         instead of flattening it.

         Read it through gsap.getProperty: GSAP folds the individual CSS
         `translate`/`rotate`/`scale` properties in, whereas getComputedStyle
         can hand back an unresolved calc(), which silently reads as 0. */
      const rail = new Map<Element, number>();
      const onRail = (selector: string) => {
        const els = gsap.utils.toArray<Element>(selector);
        for (const el of els) rail.set(el, Number(gsap.getProperty(el, "x")) || 0);
        return els;
      };
      const railX = (_i: number, el: Element) => rail.get(el) ?? 0;

      let cueShown = true;

      /* Reveal distances are proportional to the stage, not fixed pixels: the
         copy has to start tucked behind the bottle whatever size the stage ends
         up at (the CSS cap shrinks it on shorter windows). At the 720px design
         size these come out as the tuned 130 / 54 / 150 / 120px. */
      const S = stage.current?.clientWidth || 720;
      const REVEAL = { line: S * 0.18, cta: S * 0.075, media: S * 0.208, feature: S * 0.167 };

      const lines = onRail("[data-anim='line']");
      const ctas = onRail("[data-anim='cta']");
      const media = onRail("[data-anim='media']");
      const features = onRail("[data-anim='feature']");

      // Hand GSAP the rail positions the same way, so the resting offset lives in
      // its own transform and survives any re-parse instead of depending on the
      // CSS `translate` property it is about to neutralise.
      gsap.set([...lines, ...ctas, ...media, ...features], { x: railX });

      /* Initial state, applied before first paint so nothing flashes in.

         Everything waits tucked in behind the bottle — the headline and buttons
         to the right of their slot, the right-hand column to the left of it — so
         every part of the copy slides out from the same place. yPercent for the
         bottle is relative to its own layer, so parking it above the fold holds
         at any viewport size (a pixel distance measured at mount goes stale the
         moment the stage resizes). */
      gsap.set(bottle.current, { yPercent: -105, opacity: 0 });
      gsap.set(lines, {
        x: (_i, el) => railX(0, el) + REVEAL.line,
        opacity: 0,
        filter: "blur(5px)",
      });
      gsap.set(ctas, { x: (_i, el) => railX(0, el) + REVEAL.cta, opacity: 0 });
      gsap.set(media, { x: (_i, el) => railX(0, el) - REVEAL.media, opacity: 0 });
      gsap.set(features, { x: (_i, el) => railX(0, el) - REVEAL.feature, opacity: 0 });
      gsap.set("[data-anim='watermark']", { opacity: 0, scale: 1.06 });
      gsap.set("[data-anim='nav']", { y: -22, opacity: 0 });

      /* The sequence is driven by scroll: the stage is held in place with CSS
         position: sticky inside a taller section, and the visitor's scrolling
         scrubs the timeline across that extra distance — down plays it, up
         rewinds it. Sticky rather than ScrollTrigger's own pin on purpose: the
         app shell's flex body collapses a pin-spacer back to one viewport tall,
         which leaves nothing to scroll. scrub's catch-up tween smooths out the
         wheel rather than snapping to it. */
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          onUpdate: (self) => {
            const wantCue = self.progress <= 0.01;
            if (wantCue !== cueShown) {
              cueShown = wantCue;
              gsap.to(cue.current, { opacity: wantCue ? 1 : 0, duration: 0.35, overwrite: true });
            }
          },
        },
      });

      // The first frame is deliberately empty, so invite the scroll that plays it.
      gsap.to(cue.current, { opacity: 1, duration: 0.8, delay: 0.5, ease: "power2.out" });

      tl
        /* ——— 2. the drop: gravity down, then a soft landing with one settle ——— */
        .set(bottle.current, { opacity: 1 }, 0)
        .to(bottle.current, { yPercent: 0, duration: 1, ease: "power2.in" }, 0)
        // impact squashes along the bottle's own axis, then breathes back out
        .to("[data-anim='bottle-art']", { scaleY: 0.94, duration: 0.12, ease: "power2.out" }, 1)
        .to(bottle.current, { yPercent: -1.4, duration: 0.42, ease: "power2.out" }, 1)
        .to(
          "[data-anim='bottle-art']",
          { scaleY: 1, duration: 1.05, ease: "elastic.out(1, 0.45)" },
          1.12,
        )
        .to(bottle.current, { yPercent: 0, duration: 0.75, ease: "sine.inOut" }, 1.35)

        // the orb blooms out behind the falling bottle
        .fromTo(
          circle.current,
          { scale: 2.2, opacity: 0 },
          { scale: 1, opacity: 0.55, duration: 2, ease: "power3.out" },
          0.1,
        )

        /* ——— 3. copy slides out from behind the bottle ——— */
        /* Both columns share the same two beats, so neither side appears ahead
           of the other: the headline lands with the product photo, and the
           buttons land with the feature rows. Each side still emerges from
           behind the bottle — it just does so in step. Within a side the order
           is still top-down, so the cascade reads as intended. */
        // beat 1 — headline (left) together with the product photo (right)
        .to(lines, { x: railX, opacity: 1, duration: 0.9, stagger: 0.09 }, 1)
        // blur clears faster than the fade so the text sharpens as it arrives
        .to(lines, { filter: "blur(0px)", duration: 0.5, stagger: 0.09, ease: "power2.out" }, 1)
        .to(media, { x: railX, opacity: 1, duration: 0.9 }, 1)
        // beat 2 — buttons (left) together with the feature rows (right)
        .to(ctas, { x: railX, opacity: 1, duration: 0.8, stagger: 0.1 }, 1.9)
        .to(features, { x: railX, opacity: 1, duration: 0.8, stagger: 0.1 }, 1.9)

        // ISMOT watermark breathes in softly behind everything
        .to(
          "[data-anim='watermark']",
          { opacity: 1, scale: 1, duration: 1.8, ease: "power2.out" },
          1.15,
        )

        /* ——— 4. nav only once the bottle has landed ——— */
        .to("[data-anim='nav']", { y: 0, opacity: 1, duration: 0.9 }, 1.4);

      // Handy while designing: window.heroTl.seek(1.3) / .pause() in the console.
      if (process.env.NODE_ENV !== "production") {
        (window as Window & { heroTl?: unknown }).heroTl = tl;
        (window as Window & { heroST?: unknown }).heroST = tl.scrollTrigger;
      }
    },
    { scope: root },
  );

  return (
    // The extra height is the scroll runway the sequence is scrubbed across;
    // the stage itself sticks to the top of it. flex-none so the app shell's
    // flex column cannot squeeze the runway away.
    <section ref={root} className="hero relative h-[250svh] w-full flex-none">
      <div className="hero-scene sticky top-0 h-svh w-full overflow-hidden bg-[url('/hero-bg.jpg')] bg-cover bg-center bg-no-repeat">
        {/* Header nav — same layout as the reference: links left, logo center, links right */}
        <header
          data-anim="nav"
          className="absolute inset-x-0 top-0 z-40 flex justify-center pt-7 opacity-0"
        >
          <nav aria-label="Primary" className="flex items-center gap-10">
            <a
              href="#home"
              className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#3a5a2a] transition-colors hover:text-[#1e3512]"
            >
              Home
            </a>
            <a
              href="#about"
              className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#3a5a2a] transition-colors hover:text-[#1e3512]"
            >
              About Us
            </a>
            <a
              href="#home"
              aria-label="Ismot — home"
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-[9px] font-bold uppercase tracking-[0.2em] text-white"
            >
              Ismot
            </a>
            <a
              href="#products"
              className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#3a5a2a] transition-colors hover:text-[#1e3512]"
            >
              Products
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </a>
            <a
              href="#contact"
              className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#3a5a2a] transition-colors hover:text-[#1e3512]"
            >
              Contact
            </a>
          </nav>
        </header>

        {/* Hero copy — left side, real text (not images) so GSAP can animate it.
            Hangs on the guide line: right edges ride the diagonal, stepping left
            as they descend (~0.29 x per y, matching the bottle's tilt). */}
        <div className="absolute left-5 top-[var(--band-top)] z-20 w-[min(48%,470px)] sm:left-11">
          <h1 className="text-right text-[clamp(1.45rem,3.3vw,2.85rem)] font-black uppercase leading-[0.95] tracking-tight text-[#243d14]">
            <span data-anim="line" className="block opacity-0">
              Natural Care
            </span>
            <span data-anim="line" className="block -translate-x-3 opacity-0">
              for Healthier
            </span>
            <span data-anim="line" className="block -translate-x-6 opacity-0">
              Shinier Hair
            </span>
          </h1>
          {/* offsets belong to the SLOT (top/bottom) so the rail stays on the guide line */}
          <div className="mt-7 flex flex-col items-end gap-4">
            <a
              data-anim="cta"
              href="#benefits"
              className="group -translate-x-11 inline-flex items-center gap-3 rounded-full border-2 border-[#3e6427] px-6 py-3 text-[13px] font-bold uppercase tracking-[0.15em] text-[#3e6427] opacity-0 transition-colors hover:bg-[#3e6427] hover:text-white"
            >
              View Benefits
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </a>
            <a
              data-anim="cta"
              href="#shop"
              className="group -translate-x-[62px] inline-flex items-center gap-3 rounded-full bg-[#3e6427] px-6 py-3 text-[13px] font-bold uppercase tracking-[0.15em] text-white opacity-0 transition-colors hover:bg-[#32511e]"
            >
              Shop Now
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Right column — product photo + features grouped in ONE wrapper so
            later animations can move them as a single unit */}
        <div className="absolute right-8 top-[var(--band-top)] z-20 w-[min(40%,420px)] sm:right-14">
          <img
            data-anim="media"
            src="/product-hd.webp"
            alt="ISMOT Herbal Oil — spray bottle and carton with natural herbs"
            className="mb-1 w-[min(52%,200px)] opacity-0"
          />
          <div className="space-y-4">
            <div data-anim="feature" className="flex -translate-x-4 items-start gap-3.5 opacity-0">
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#4a7031] text-[#4a7031]">
                <LeafIcon />
              </span>
              <div>
                <h3 className="text-[15px] font-black uppercase leading-snug tracking-tight text-[#243d14]">
                  100% Natural Ingredients
                </h3>
                <p className="mt-1 text-[11px] font-semibold uppercase leading-relaxed tracking-[0.05em] text-[#57734a]">
                  Pure herbs. No harmful chemicals.
                  <br />
                  Just the goodness of nature.
                </p>
              </div>
            </div>

            <div data-anim="feature" className="-translate-x-8 border-t border-[#3e6427]/20 opacity-0" />

            <div data-anim="feature" className="flex -translate-x-8 items-start gap-3.5 opacity-0">
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#4a7031] text-[#4a7031]">
                <DropletIcon />
              </span>
              <div>
                <h3 className="text-[15px] font-black uppercase leading-snug tracking-tight text-[#243d14]">
                  100 ml Pure Hair Care
                </h3>
                <p className="mt-1 text-[11px] font-semibold uppercase leading-relaxed tracking-[0.05em] text-[#57734a]">
                  Nourishes, strengthens and
                  <br />
                  brings natural shine.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Giant watermark behind the circle, like the reference video */}
        <span
          data-anim="watermark"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 flex select-none flex-col items-center justify-center whitespace-nowrap text-[19vw] font-black uppercase leading-[0.9] text-white/20 opacity-0"
        >
          <span>Ismot</span>
          <span>Ismot</span>
        </span>

        {/* Scroll cue — the first frame is empty by design, so point the way.
            Hidden for reduced-motion (there is no scrub to invite), and it leaves
            the moment the scrub starts. */}
        <div
          ref={cue}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 opacity-0"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#3a5a2a]">
            Scroll
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#3a5a2a]"
          >
            <path d="M12 5v14" />
            <path d="m6 13 6 6 6-6" />
          </svg>
        </div>

        {/* Orb + bottle. The stage deliberately has no z-index: without a stacking
            context the bottle can sit on its own layer (z-30) above the copy,
            while the orb stays behind it — so the headline slides out from behind
            the bottle instead of from behind the orb. */}
        <div ref={stage} className="hero-stage aspect-square">
          <img
            ref={circle}
            src="/circle-white.webp"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full select-none opacity-0"
          />
          <div ref={bottle} data-anim="bottle" className="pointer-events-none absolute inset-0 z-30 opacity-0">
            <img
              data-anim="bottle-art"
              src="/bottle.webp"
              alt="ISMOT Hair Oil bottle"
              className="absolute left-1/2 top-[40%] h-[86%] w-auto select-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
