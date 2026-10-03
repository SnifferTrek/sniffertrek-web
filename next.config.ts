import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const v2NoStore = [
  { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
  { key: "CDN-Cache-Control", value: "no-store" },
  { key: "Vercel-CDN-Cache-Control", value: "no-store" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/v2", headers: v2NoStore },
      { source: "/:locale(en|es)/v2", headers: v2NoStore },
      { source: "/v3", headers: v2NoStore },
      { source: "/:locale(en|es)/v3", headers: v2NoStore },
    ];
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nsbextebigfuhqujysev.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zYmV4dGViaWdmdWhxdWp5c2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDYzNjYsImV4cCI6MjA4NjkyMjM2Nn0.MSFCN4PhU5px0gjDitq4CjVxrxUXy2OVa6UuoQrBtp0",
    NEXT_PUBLIC_GOOGLE_MAPS_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "AIzaSyDTcV42T-ZkriZOB8RtNZMtGR8gZq3Izi0",
  },
};

export default withNextIntl(nextConfig);
