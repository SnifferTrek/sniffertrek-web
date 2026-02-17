import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SnifferTrek – Deine Reise planen, vergleichen & buchen",
  description:
    "Plane deine Traumreise: Route, Hotels, Flüge, Mietwagen und Sehenswürdigkeiten – alles in einem Tool. Vergleiche Preise und buche direkt.",
  keywords: [
    "Reiseplanung",
    "Reise planen",
    "Hotel buchen",
    "Flug buchen",
    "Roadtrip planen",
    "Reiseroute",
    "Bucket List",
    "Sehenswürdigkeiten",
    "Reisevergleich",
  ],
  openGraph: {
    title: "SnifferTrek – Deine Reise planen, vergleichen & buchen",
    description:
      "Plane deine Traumreise: Route, Hotels, Flüge, Mietwagen und Sehenswürdigkeiten – alles in einem Tool.",
    type: "website",
    locale: "de_CH",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
