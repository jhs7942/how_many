import type { NextConfig } from "next";

// 앱(Capacitor) 빌드: NEXT_STATIC_EXPORT=true npm run build
const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  ...(isStaticExport && {
    output: 'export',
    trailingSlash: true,
    images: { unoptimized: true },
  }),
};

export default nextConfig;
