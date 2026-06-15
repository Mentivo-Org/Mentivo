import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    PERCENTAGE_COMPLETED: process.env.PERCENTAGE_COMPLETED || "0",
  },
  allowedDevOrigins: ['192.168.29.18']
};

export default nextConfig;
