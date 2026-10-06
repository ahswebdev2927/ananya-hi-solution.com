/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/services",
        destination: "/",
        permanent: false,
      },
    ];
  },

  allowedDevOrigins: ["snipping-unhidden-basin.ngrok-free.dev"],
};

export default nextConfig;
