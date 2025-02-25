/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['szzgvrcgvhlwejkgtwfl.supabase.co'], // الدومين بدون /storage أو أي مسارات أخرى
  },
}

module.exports = nextConfig;
