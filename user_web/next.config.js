/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // TODO: Change this
        hostname: "**",
      },
    ],
  },
}

module.exports = nextConfig
