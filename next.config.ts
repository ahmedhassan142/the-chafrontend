import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   images: {
    domains: ['www.vecteezy.com'],
    // or with newer Next.js versions, use:
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.vecteezy.com',
        pathname: '/vector-art/**',
      },
    ],
  },
   env: {
   NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
   JWTPRIVATEKEY:process.env.JWTPRIVATEKEY
  },
  /* config options here */
   eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
