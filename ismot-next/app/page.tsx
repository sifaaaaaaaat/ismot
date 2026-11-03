import Hero from "./hero";
import PosterSection from "./poster";

/**
 * The homepage is the client's three approved posters, stacked in order: the
 * hero fills the screen, then the ingredients flat-lay, then the benefits
 * sheet. Everything the visitor sees is painted into the artwork, so each
 * section is an image with real controls laid over the painted buttons.
 */
export default function Home() {
  return (
    <main>
      <Hero />

      <PosterSection
        src="/botanicals.webp"
        alt="More than botanicals — a balanced blend of nature's finest ingredients. Wooden bowls on a dark table hold rosemary, amla, bhringraj, shikakai, fenugreek, kalonji, hibiscus, olive, aloe vera and reetha, with a yellow hibiscus in bloom."
      />

      <PosterSection
        src="/benefits.webp"
        alt="Benefits of Ismot Hair Oil. A 100 ml spray bottle stands on a stone plinth between four cards: reduces hair fall, promotes new hair growth, prevents premature greying, and adds shine and smoothness, with a Buy Now button below."
        hotspot={{
          href: "/order",
          label: "Buy Ismot Hair Oil now",
          // Measured from the artwork: the painted Buy Now pill, its gold
          // border included, with a little room either side for the thumb.
          box: { left: 62.4, top: 87.3, width: 34.3, height: 4.7 },
        }}
      />
    </main>
  );
}
