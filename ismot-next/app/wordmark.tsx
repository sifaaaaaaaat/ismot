/**
 * The wordmark, as text.
 *
 * The artwork's logo is a raster crop with its foliage background baked in, so
 * it cannot sit on the flat panels of the order page and menu. This rebuilds the
 * same lockup — "Ismot" with the ruled HAIR OIL line beneath it — in the display
 * face, which stays sharp at any size and is readable to search engines.
 */
export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col leading-none ${className}`}>
      <span className="font-display text-[1.75rem] font-semibold tracking-[0.01em] text-cream sm:text-[2rem]">
        Ismot
      </span>
      <span className="mt-1 flex items-center gap-2 text-[7px] font-semibold uppercase tracking-[0.34em] text-gold/80 sm:text-[8px]">
        <span className="h-px flex-1 bg-gold/45" aria-hidden="true" />
        Hair Oil
        <span className="h-px flex-1 bg-gold/45" aria-hidden="true" />
      </span>
    </span>
  );
}
