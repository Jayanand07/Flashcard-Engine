/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdf-parse"],
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' *.supabase.co; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.google.com *.googleapis.com *.supabase.co; style-src 'self' 'unsafe-inline' fonts.googleapis.com; img-src 'self' data: *.googleusercontent.com *.supabase.co; font-src 'self' fonts.gstatic.com; connect-src 'self' *.supabase.co *.googleapis.com; frame-src *.google.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
