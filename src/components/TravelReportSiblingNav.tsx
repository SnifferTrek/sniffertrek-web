import { useTranslations } from "next-intl";
import type { TravelReportSlug } from "@/lib/travelReports/types";
import { TRAVEL_REPORT_NAV } from "@/lib/travelReports/travelReportNav";
import { Link } from "@/i18n/navigation";

export type { TravelReportSlug };

type TravelReportSiblingNavProps = {
  current: TravelReportSlug;
};

const TAB_ACTIVE =
  "rounded-full bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm";
const TAB_INACTIVE =
  "rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900";

export default function TravelReportSiblingNav({ current }: TravelReportSiblingNavProps) {
  const t = useTranslations("ideas");
  const tChrome = useTranslations("chrome");
  const tReports = useTranslations("reports");

  return (
    <nav
      className="flex flex-wrap items-center gap-2"
      aria-label={t("moreReports")}
    >
      <Link
        href="/unsere-reisen"
        className="text-xs font-semibold uppercase tracking-wider text-stone-400 hover:text-stone-600"
      >
        {tChrome("travelIdeas")}
      </Link>
      {TRAVEL_REPORT_NAV.map((report) => {
        const active = report.slug === current;
        return (
          <Link
            key={report.href}
            href={report.href}
            aria-current={active ? "page" : undefined}
            className={active ? TAB_ACTIVE : TAB_INACTIVE}
          >
            {tReports(`${report.slug}.label` as Parameters<typeof tReports>[0])}
          </Link>
        );
      })}
    </nav>
  );
}

/** @deprecated Import aus `@/lib/travelReports/travelReportNav` */
export { TRAVEL_REPORT_NAV };
