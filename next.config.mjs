/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.ananyahisolutions.com",
          },
        ],
        destination: "https://ananyahisolutions.com/:path*",
        permanent: true,
      },
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
