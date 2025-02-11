/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["lbjyvkxjnqiydfivnaog.supabase.co"], // Add your Supabase hostname here
  },
};

export default nextConfig;
