import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* exceljs is a CommonJS package with Node-only internals; loading it through
     the bundler breaks its file access, so it stays an external dependency of
     the server build (used only by the admin .xlsx export). */
  serverExternalPackages: ["exceljs"],

  /* The posters are already delivered at the size they are drawn (841x1870
     WebP), so the image optimizer has nothing to do but re-encode them — and on
     Vercel that is a function hop on the LCP image, with a cache MISS measured
     at ~0.6s before the first byte. Serving the files themselves keeps them on
     the CDN: one request, no cold path, no per-width variants. */
  images: { unoptimized: true },

  /* Vercel hands out files in public/ with `max-age=0, must-revalidate`, so
     every visit re-validated all three posters. They are artwork and change
     rarely; an hour of freshness plus a day of stale-while-revalidate makes a
     repeat visit instant without hiding a new poster for long. */
  async headers() {
    return [
      {
        source: "/:poster(hero-phone|botanicals|benefits|bottle).webp",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },

  /* A phone on the same Wi-Fi opens the dev server by its LAN address, and Next
     blocks non-localhost dev origins (HMR and /_next chunks) by default. These
     are this machine's DHCP addresses; add a new one if the router reassigns. */
  allowedDevOrigins: ["192.168.0.101", "192.168.0.105"],
};

export default nextConfig;
