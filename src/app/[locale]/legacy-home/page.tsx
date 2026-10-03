import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const SITE = "https://www.sniffertrek.com";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  const path = locale === "de" ? `${SITE}/legacy-home` : `${SITE}/${locale}/legacy-home`;
  return {
    title: `Legacy · ${t("homeTitle")}`,
    robots: { index: false, follow: false },
    alternates: { canonical: path },
  };
}

export default async function LegacyHomeRoute({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return null;
  }
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Legacy-Homepage</h1>
      <p className="mt-4 text-[var(--bcn-muted,#6e6e73)]">
        Die vorherige Startseite ist als <code>LegacyHomePage</code> im Repository archiviert.
      </p>
      <Link href="/" className="mt-6 inline-flex text-sm font-semibold text-[var(--bcn-blue,#0071e3)] hover:underline">
        Zur aktuellen Homepage
      </Link>
    </div>
  );
}
