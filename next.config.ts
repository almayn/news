import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['szzgvrcgvhlwejkgtwfl.supabase.co'], // أضف المضيف هنا
  },
}

module.exports = nextConfig;

