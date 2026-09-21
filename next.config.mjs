/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Content modules are pure data; keeping them external-friendly keeps builds fast.
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
