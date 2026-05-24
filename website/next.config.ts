import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    PERCENTAGE_COMPLETED: process.env.PERCENTAGE_COMPLETED || "0",
  },
};

export default nextConfig;
