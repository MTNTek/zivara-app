import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output for optimized Docker production image
  output: 'standalone',

  // Transpile the shared monorepo package
  transpilePackages: ['@zivara/shared'],

  // Strict mode for catching potential React issues early
  reactStrictMode: true,
};

export default nextConfig;
