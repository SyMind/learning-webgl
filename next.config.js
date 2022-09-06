/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  basePath: '/webgl-study-room',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/webgl-study-room' : ''
}

module.exports = nextConfig
