import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import "../v2/v2.css";

const script = Caveat({
  subsets: ["latin"],
  variable: "--font-v2-script",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Homepage V3.3 – Prototyp",
  description: "SnifferTrek Homepage V3.3 – Vergleichsprototyp, nicht indexiert.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  alternates: { canonical: "https://www.sniffertrek.com/v3" },
};

export default function V3Layout({ children }: { children: React.ReactNode }) {
  return <div className={script.variable}>{children}</div>;
}
