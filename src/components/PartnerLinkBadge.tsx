"use client";

import { useTranslations } from "next-intl";
import { partnerLabelFromUrl } from "@/lib/partnerLabelFromUrl";

export function PartnerAffiliateMark({
  href,
  className = "ml-1 text-[10px] font-normal uppercase tracking-wide opacity-70",
}: {
  href: string;
  className?: string;
}) {
  const t = useTranslations("reportUi");
  const { isAffiliate } = partnerLabelFromUrl(href);
  if (!isAffiliate) return null;
  return <span className={className}>{t("partnerLinkBadge")}</span>;
}
