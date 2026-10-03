import Image from "next/image";

/**
 * The screen directly below the hero.
 *
 * The backdrop is the hero's own artwork, mirrored vertically (see below), so
 * the two screens read as one continuous surface rather than two panels with a
 * seam between them.
 *
 * Why mirroring is what removes the seam: `hero-bg.jpg` is a vertical
 * gradient — palest at its top, deepest at its bottom — and `cover` maps its
 * height onto the viewport, so the hero's scene ENDS on the image's deepest
 * row. Painting the same image upright here would restart it at the palest
 * row, which is the abrupt band edge you see at the join. Flipping the layer
 * puts the deepest row back at this panel's top edge, so the gradient carries
 * on through the join instead of restarting. Because the layer gets the same
 * box and the same `cover` crop as the scene, the two rows are the same row —
 * the join is exact at any viewport size, not just the design size.
 *
 * The flip lives on an inner layer, never on the section, so content added
 * here later is not mirrored with it.
 *
 * The white orb is the hero's circle-white.webp at the hero's --stage size
 * (see .next-scene / .next-orb in globals.css), resting at the hero's orb
 * opacity of 0.55, centred on the spot the design marks on the panel's
 * left-hand half.
 *
 * The giant ISMOT watermark repeats the hero's (same 19vw black type at
 * white/20, same two-line stack, real text) with one difference: it centres in
 * the panel's RIGHT-hand band (left 38% → right edge) where the design marks
 * it, rather than in the whole scene. It sits before the orb in the DOM with
 * z-0, so — same as the hero — the orb paints over it.
 *
 * Updated per the latest mark: the giant type is replaced by a COLUMN of small
 * repeated ISMOT lines (4–6 lines, same black white/20 treatment), centred in
 * that same right-hand band, whose left edge is derived from the orb's right
 * edge so the column never overlaps the circle. See .next-wordmark in
 * globals.css.
 *
 * One viewport tall (`h-svh`, matching the hero scene) and `flex-none` so the
 * app shell's flex column cannot squeeze it.
 *
 * Staged on /blank (see app/blank/page.tsx) until its content settles.
 */
export default function NextSection() {
  return (
    <section className="next-scene relative h-svh w-full flex-none overflow-hidden">
      {/* -scale-y-100 = scaleY(-1): the section's backdrop continues the
          gradient the hero's scene ended on. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -scale-y-100 bg-[url('/hero-bg.jpg')] bg-cover bg-center bg-no-repeat"
      />
      {/* The repeated small-ISMOOT wordmark column — same black white/20
          treatment as the hero's watermark, shrunk and repeated down the
          right-hand band. The band's left edge moves with the orb's right edge
          (+16px gap), so no line can ever touch the circle. Hidden below sm:
          there the orb spans ~90% of the width, the band collapses, and the
          only way to keep the no-overlap promise is to not render the column
          (same call as the product section's floating pills). */}
      <span
        aria-hidden="true"
        className="next-wordmark pointer-events-none z-0 hidden select-none flex-col items-center justify-center gap-[0.35em] whitespace-nowrap text-[clamp(0.9rem,1.5vw,1.35rem)] font-black uppercase leading-none tracking-[0.22em] text-white/20 sm:flex"
      >
        <span>Ismot</span>
        <span>Ismot</span>
        <span>Ismot</span>
        <span>Ismot</span>
        <span>Ismot</span>
        <span>Ismot</span>
      </span>
      {/* The hero's orb, parked on the marked spot. pointer-events-none so the
          empty panel stays inert; opacity-55 = the hero orb's resting value.
          next/image (not a plain <img>) because nothing animates it — the
          hero's three <img>s stay plain only so GSAP can transform them. */}
      <Image
        src="/circle-white.webp"
        alt=""
        aria-hidden="true"
        width={1200}
        height={1200}
        className="next-orb pointer-events-none select-none opacity-55"
      />
    </section>
  );
}
