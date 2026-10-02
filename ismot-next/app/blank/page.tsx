import Hero from "../hero";
import Product from "../product";

/**
 * Blank page — a scratch copy of the homepage at `/`.
 *
 * It renders the same <Hero /> and then the new <Product /> section below it,
 * so the next section can be built and reviewed here without touching the
 * approved homepage. Anything that settles can be moved into `app/page.tsx`.
 *
 * Route: /blank  (nested under the root layout, so fonts and the shell match `/`)
 */
export default function Blank() {
  return (
    <>
      <Hero />
      <Product />
    </>
  );
}
