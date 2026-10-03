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
      {/* The hero's giant watermark, same type treatment, centred in the
          right-hand band. z-0 + DOM order before the orb keeps it behind the
          orb, as in the hero. No opacity-0: nothing animates here yet. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-[38%] right-0 z-0 flex select-none flex-col items-center justify-center whitespace-nowrap text-[19vw] font-black uppercase leading-[0.9] text-white/20"
      >
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
