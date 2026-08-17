import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useTypeScriptCli: false,
  },
  async redirects() {
    return [
      { source: "/volunteer", destination: "/", permanent: false },
      { source: "/senior", destination: "/", permanent: false },
      { source: "/community-admin", destination: "/", permanent: false },
      { source: "/admin", destination: "/", permanent: false },
      { source: "/calendar", destination: "/", permanent: false },
      { source: "/directory", destination: "/", permanent: false },
      { source: "/events/:path*", destination: "/", permanent: false }
    ];
  },
};

export default nextConfig;
