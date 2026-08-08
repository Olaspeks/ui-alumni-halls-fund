/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Nothing here assumes a local filesystem or hardcoded host — safe for
  // Vercel's serverless/edge runtime out of the box.
};

module.exports = nextConfig;
