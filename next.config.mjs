/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  turbopack: {
    root: process.cwd(),
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
