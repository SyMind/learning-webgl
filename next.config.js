const isProduction = process.env.NODE_ENV === 'production'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  basePath: isProduction ? '/webgl-study-room' : '',
  assetPrefix: isProduction ? '/webgl-study-room' : ''
}

module.exports = nextConfig
