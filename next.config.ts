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
      { source: "/list/semiconductors", destination: "/list/semiconductor-stocks", permanent: false },
      { source: "/list/reits", destination: "/list/reit-stocks", permanent: false },
      { source: "/list/banks", destination: "/list/bank-stocks", permanent: false },
      { source: "/list/airlines", destination: "/list/airline-stocks", permanent: false },
      { source: "/list/gold", destination: "/list/gold-stocks", permanent: false },
      { source: "/list/restaurants", destination: "/list/restaurant-stocks", permanent: false },
      { source: "/list/faang-stocks", destination: "/list/faang", permanent: false },
      { source: "/stocks/screener", destination: "/screener", permanent: false },
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
