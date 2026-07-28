/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'avatars.githubusercontent.com'],
  },
}

module.exports = nextConfig
