/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rru.ac.in",
        port: "",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
  reactStrictMode: true,
};
