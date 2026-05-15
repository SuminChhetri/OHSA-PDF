/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NEXT_BUILD_STANDALONE === "1" ? "standalone" : undefined,
  transpilePackages: ["@osha/db", "@osha/regulatory-logic"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "@react-pdf/renderer"],
  },
};

module.exports = nextConfig;
