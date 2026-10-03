/**
 * The screen directly below the hero.
 *
 * It paints the same backdrop image as `.hero-scene`, at the same viewport
 * height and cover crop, so leaving the hero's scroll runway lands on a panel
 * that reads as the same surface rather than a new one.
 *
 * One viewport tall (`h-svh`, matching the hero scene) and `flex-none` so the
 * app shell's flex column cannot squeeze it.
 *
 * Staged on /blank (see app/blank/page.tsx) until its content settles.
 */
export default function NextSection() {
  return (
    <section className="relative h-svh w-full flex-none bg-[url('/hero-bg.jpg')] bg-cover bg-center bg-no-repeat" />
  );
}
