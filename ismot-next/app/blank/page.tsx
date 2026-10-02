import Hero from "../hero";

/**
 * Blank page — a mirror of the homepage at `/`.
 *
 * It renders the same <Hero /> component and nothing else, so this route can be
 * used to try things out without touching the approved hero on the homepage.
 * Anything that settles here can be moved into `app/page.tsx` afterwards.
 *
 * Route: /blank  (nested under the root layout, so fonts and the shell match `/`)
 */
export default function Blank() {
  return <Hero />;
}
