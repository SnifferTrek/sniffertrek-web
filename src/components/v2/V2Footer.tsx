"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { V2_HOW_HREF, V2_IDEAS_HREF, V2_PLAN_HREF } from "@/lib/v2HomeData";

type Props = {
  homeHref?: string;
};

export default function V2Footer({ homeHref = "/" }: Props) {
  const tChrome = useTranslations("chrome");
  const tFooter = useTranslations("footer");

  return (
    <footer className="border-t border-[var(--v2-line)] py-8 bg-[var(--v2-bg)]">
      <div className="v2-wrap flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href={homeHref} aria-label={tChrome("homeAria")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/sniffertrek-logo.svg"
              alt="SnifferTrek"
              className="h-6 w-auto"
              width={120}
              height={26}
            />
          </Link>
          <p className="text-sm text-[var(--v2-muted)]">{tFooter("tagline")}</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--v2-muted)]">
          <Link href={V2_PLAN_HREF} className="hover:text-[var(--v2-ink)]">{tFooter("planTrip")}</Link>
          <Link href={V2_IDEAS_HREF} className="hover:text-[var(--v2-ink)]">{tChrome("travelIdeas")}</Link>
          <Link href={V2_HOW_HREF} className="hover:text-[var(--v2-ink)]">{tChrome("howItWorks")}</Link>
          <Link href="/impressum" className="hover:text-[var(--v2-ink)]">{tFooter("imprint")}</Link>
          <Link href="/datenschutz" className="hover:text-[var(--v2-ink)]">{tFooter("privacy")}</Link>
        </nav>
      </div>
    </footer>
  );
}
