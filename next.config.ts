/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.imgur.com" },
    ],
  },
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
