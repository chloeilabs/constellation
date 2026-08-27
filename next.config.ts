import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async redirects() {
    return [
      { source: "/etf/vanguard", destination: "/list/vanguard-etfs", permanent: false },
      { source: "/etf/ishares", destination: "/list/ishares-etfs", permanent: false },
      { source: "/etf/spdr", destination: "/list/spdr-etfs", permanent: false },
      { source: "/etf/invesco", destination: "/list/invesco-etfs", permanent: false },
      { source: "/etf/schwab", destination: "/list/schwab-etfs", permanent: false },
    ];
  },
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
