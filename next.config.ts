import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.financialmodelingprep.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "financialmodelingprep.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
