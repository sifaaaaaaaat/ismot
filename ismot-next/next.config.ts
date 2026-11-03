import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* exceljs is a CommonJS package with Node-only internals; loading it through
     the bundler breaks its file access, so it stays an external dependency of
     the server build (used only by the admin .xlsx export). */
  serverExternalPackages: ["exceljs"],

  /* A phone on the same Wi-Fi opens the dev server by its LAN address, and Next
     blocks non-localhost dev origins (HMR and /_next chunks) by default. These
     are this machine's DHCP addresses; add a new one if the router reassigns. */
  allowedDevOrigins: ["192.168.0.101", "192.168.0.105"],
};

export default nextConfig;
