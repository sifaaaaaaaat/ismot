import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* exceljs is a CommonJS package with Node-only internals; loading it through
     the bundler breaks its file access, so it stays an external dependency of
     the server build (used only by the admin .xlsx export). */
  serverExternalPackages: ["exceljs"],
};

export default nextConfig;
