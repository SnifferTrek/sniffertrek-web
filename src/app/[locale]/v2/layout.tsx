import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import "./v2.css";

const script = Caveat({
  subsets: ["latin"],
  variable: "--font-v2-script",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Homepage-Prototyp",
  description: "Isolierter SnifferTrek-2.0-Prototyp – nicht indexiert.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  alternates: { canonical: "https://www.sniffertrek.com/v2" },
};

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return <div className={script.variable}>{children}</div>;
}
