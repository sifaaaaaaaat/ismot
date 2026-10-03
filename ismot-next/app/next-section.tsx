/**
 * The screen directly below the hero.
 *
 * The backdrop is the hero's own artwork, mirrored vertically (see below), so
 * the two screens read as one continuous surface rather than two panels with a
 * seam between them.
 *
 * Why mirroring is what removes the seam: `.hero-bg.jpg` is a vertical
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
 * One viewport tall (`h-svh`, matching the hero scene) and `flex-none` so the
 * app shell's flex column cannot squeeze it.
 *
 * Staged on /blank (see app/blank/page.tsx) until its content settles.
 */
export default function NextSection() {
  return (
    <section className="relative h-svh w-full flex-none">
      {/* -scale-y-100 = scaleY(-1): the section's backdrop continues the
          gradient the hero's scene ended on. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -scale-y-100 bg-[url('/hero-bg.jpg')] bg-cover bg-center bg-no-repeat"
      />
    </section>
  );
}
