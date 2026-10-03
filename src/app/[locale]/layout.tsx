import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Instrument_Sans, Plus_Jakarta_Sans, Syne } from "next/font/google";
import "../globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import AuthProvider from "@/components/AuthProvider";
import { KontoPanelProvider } from "@/components/KontoPanelContext";
import V2HideSiteChrome from "@/components/v2/V2HideSiteChrome";
import { routing } from "@/i18n/routing";

const display = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
});

const atlas = Syne({
  variable: "--font-atlas",
  subsets: ["latin"],
});

const apple = Instrument_Sans({
  variable: "--font-bcn",
  subsets: ["latin"],
  display: "swap",
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL("https://www.sniffertrek.com"),
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${display.variable} ${atlas.variable} ${apple.variable} [font-family:var(--font-display),system-ui,sans-serif] text-base leading-relaxed antialiased bg-[var(--st-bg)] text-zinc-800`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <KontoPanelProvider>
              <V2HideSiteChrome>
                <Header />
              </V2HideSiteChrome>
              <main>{children}</main>
              <V2HideSiteChrome>
                <Footer />
              </V2HideSiteChrome>
              <V2HideSiteChrome>
                <CookieBanner />
              </V2HideSiteChrome>
            </KontoPanelProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
