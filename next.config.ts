import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'bivtry1w4b.ufs.sh',
    }]
  },
  output: "standalone",
  turbopack: {},
};

export default withPWA(nextConfig);
