import type { NextConfig } from 'next'

const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  devIndicators: false,
} satisfies NextConfig

export default nextConfig
