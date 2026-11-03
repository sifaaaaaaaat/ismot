import Image from "next/image";

/**
 * A full-width poster below the hero.
 *
 * The client's artwork is a 841x1870 sheet with its controls painted in, so the
 * section renders the image at its own aspect ratio and, where the artwork has a
 * button, covers it with a real anchor whose box is a percentage of the poster.
 * The poster is never cropped: it is shown whole, full width on a phone and no
 * wider than its native 841px on a desktop.
 */

type Box = { left: number; top: number; width: number; height: number };

type PosterSectionProps = {
  src: string;
  alt: string;
  hotspot?: { href: string; label: string; box: Box };
};

const boxStyle = (box: Box) => ({
  left: `${box.left}%`,
  top: `${box.top}%`,
  width: `${box.width}%`,
  height: `${box.height}%`,
});

export default function PosterSection({ src, alt, hotspot }: PosterSectionProps) {
  return (
    <section className="poster-section">
      <div className="poster-frame">
        <Image
          src={src}
          alt={alt}
          width={841}
          height={1870}
          sizes="(max-width: 841px) 100vw, 841px"
          className="poster-art"
        />

        {/* Plain anchor for the same reason as the hero's: ordering still works
            when the client bundle is stale or blocked. The hit style is shared
            with the hero's painted controls. */}
        {hotspot && (
          <a
            href={hotspot.href}
            className="hero-hit hero-hit--pill"
            style={boxStyle(hotspot.box)}
            aria-label={hotspot.label}
          />
        )}
      </div>
    </section>
  );
}
