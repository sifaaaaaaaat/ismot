import Hero from "../hero";
import NextSection from "../next-section";

/**
 * Blank page — a scratch copy of the homepage at `/`, plus the next section
 * staged below it. Anything that settles here can be moved into `app/page.tsx`.
 *
 * Route: /blank  (nested under the root layout, so fonts and the shell match `/`)
 */
export default function Blank() {
  return (
    <>
      <Hero />
      <NextSection />
    </>
  );
}
