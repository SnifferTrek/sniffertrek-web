import type { Metadata } from "next";

export const metadata: Metadata = {
 title: "Expedia Shop Kurator",
 robots: { index: false, follow: false },
};

export default function ExpediaShopCuratorLayout({ children }: { children: React.ReactNode }) {
 return children;
}
