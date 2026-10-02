"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "./gsap";

/** Floating badges around the product shot. Decorative, so they are plain text. */
const PILLS = [
  { label: "100% Natural", position: "left-0 top-6" },
  { label: "Cold-pressed", position: "right-0 top-[22%]" },
  { label: "Zero parabens", position: "left-6 bottom-10" },
];

/**
 * Product — the section that follows the hero, modelled on the reference
 * layout: a ghost word centred behind the shot, the product on one side and
 * the pitch on the other.
 *
 * Reveal is a plain opacity + y slide. Nothing here carries a CSS
 * translate/rotate, so there is no guide-rail transform for GSAP to fold away
 * (AGENTS.md, gotcha 1) — the ghost word keeps its CSS centring because it is
 * deliberately not a reveal target.
 *
 * The id is "products" (plural) to match the hero nav's Products link, so that
 * link now resolves to a real section instead of going nowhere.
 */
export default function Product() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>("[data-reveal]", root.current);

      // Motion off: this is static content, so just land on the finished state.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(items, { opacity: 1, y: 0 });
        return;
      }

      /* One trigger for the whole section: the pieces rise in together and
         play once, rather than re-animating on every scroll past. */
      gsap.set(items, { opacity: 0, y: 26 });
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.85,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 72%", once: true },
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="products"
      className="relative overflow-hidden bg-gradient-to-b from-[#e9f2da] via-[#f3f8ea] to-white px-5 py-[clamp(4rem,9vw,7.5rem)] sm:px-11"
    >
      {/* Ghost word behind the shot, as in the reference. Never a reveal target:
          GSAP would fold its centring transform away. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[clamp(5rem,21vw,19rem)] font-black uppercase leading-none tracking-tight text-white/60"
      >
        Pure
      </span>

      <div className="relative z-10 mx-auto grid max-w-[1180px] items-center gap-[clamp(2.5rem,5vw,4rem)] lg:grid-cols-[1.05fr_0.95fr]">
        {/* ---- the product shot ---- */}
        <div className="relative flex items-center justify-center">
          <div data-reveal className="relative w-full max-w-[560px]">
            {/* soft halo, echoing the hero's orb */}
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 blur-3xl"
            />
            <Image
              src="/product-hd.webp"
              alt="ISMOT Herbal Hair Oil — spray bottle and carton with natural herbs"
              width={1100}
              height={667}
              className="relative h-auto w-full drop-shadow-[0_28px_55px_rgba(36,61,20,0.22)]"
            />
          </div>

          {PILLS.map((pill) => (
            <span
              key={pill.label}
              data-reveal
              className={`absolute hidden items-center rounded-full border border-[#4a7031]/25 bg-white/85 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#3a5a2a] shadow-sm backdrop-blur sm:inline-flex ${pill.position}`}
            >
              {pill.label}
            </span>
          ))}
        </div>

        {/* ---- the pitch ---- */}
        <div className="relative">
          <p
            data-reveal
            className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#57734a]"
          >
            The hero oil
          </p>
          <h2
            data-reveal
            className="mt-4 text-[clamp(1.8rem,4vw,3.2rem)] font-black uppercase leading-[0.95] tracking-tight text-[#243d14]"
          >
            Ismot Herbal
            <br />
            Hair Oil
          </h2>
          <p
            data-reveal
            className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-[#57734a]"
          >
            One amber bottle, five cold-pressed botanicals. A light oil that sinks
            in fast to nourish the scalp, strengthen the roots and leave hair with
            a natural shine.
          </p>
          <p data-reveal className="mt-6 flex items-baseline gap-2 text-[#243d14]">
            <span className="text-[2rem] font-black tracking-tight">$24</span>
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#57734a]">
              · 100 ml
            </span>
          </p>
          <div data-reveal className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              href="#shop"
              className="inline-flex items-center rounded-full bg-[#3e6427] px-7 py-3 text-[13px] font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#32511e]"
            >
              Add to bag
            </a>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#57734a]">
              Free returns for 30 days
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
