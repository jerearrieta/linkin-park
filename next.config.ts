import type { NextConfig } from "next";

// Static export: `npm run build` leaves a plain site in /out that any static host can serve.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
