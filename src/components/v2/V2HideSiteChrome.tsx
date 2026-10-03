"use client";

import { usePathname } from "@/i18n/navigation";

export default function V2HideSiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (
    pathname === "/" ||
    pathname === "/v2" ||
    pathname.startsWith("/v2/") ||
    pathname === "/v3" ||
    pathname.startsWith("/v3/")
  ) {
    return null;
  }
  return children;
}
