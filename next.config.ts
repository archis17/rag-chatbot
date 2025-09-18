/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      "react",
      "react-dom",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-scroll-area",
      "@clerk/nextjs",
    ],
  },
};

module.exports = nextConfig;
