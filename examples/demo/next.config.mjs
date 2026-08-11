/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // crosshooks ships modern ESM/CJS; no transpile needed, but keeping the
  // package on the workspace means Next picks up rebuilds automatically.
};

export default nextConfig;
