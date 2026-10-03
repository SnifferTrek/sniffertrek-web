import type { Metadata } from "next";

const SITE = "https://www.sniffertrek.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
