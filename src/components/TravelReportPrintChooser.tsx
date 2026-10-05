"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import TravelReportPrintButton from "@/components/TravelReportPrintButton";

type PrintUiContextValue = {
  showPreview: boolean;
  setShowPreview: (v: boolean) => void;
};

const PrintUiContext = createContext<PrintUiContextValue | null>(null);

function usePrintUi() {
  const ctx = useContext(PrintUiContext);
  if (!ctx) throw new Error("usePrintUi needs PrintVariantProvider");
  return ctx;
}

export function PrintVariantProvider({ children }: { children: ReactNode }) {
  const [showPreview, setShowPreview] = useState(true);
  const value = useMemo(
    () => ({ showPreview, setShowPreview }),
    [showPreview]
  );
  return (
    <PrintUiContext.Provider value={value}>{children}</PrintUiContext.Provider>
  );
}

/**
 * Druckquelle ausserhalb von print:hidden – immer gemountet für Header-Drucker.
 */
export function TravelReportPrintSource({ atlas }: { atlas: ReactNode }) {
  return <>{atlas}</>;
}

/** PDF-Button + optionale Bildschirm-Vorschau. */
export function TravelReportPrintControls({
  atlasPreview,
}: {
  atlasPreview: ReactNode;
}) {
  const t = useTranslations("reportUi");
  const { showPreview, setShowPreview } = usePrintUi();

  return (
    <div className="no-print space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white px-4 py-3 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-stone-800">{t("printTitle")}</p>
          <p className="text-xs text-stone-500">{t("printHint")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
          >
            {showPreview ? t("hidePreview") : t("showPreview")}
          </button>
          <TravelReportPrintButton label={t("savePdf")} />
        </div>
      </div>

      {showPreview ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            {t("previewScroll")}
          </p>
          <div className="max-h-[min(80vh,920px)] overflow-auto rounded-2xl border border-stone-200 bg-stone-100/80 p-3 sm:p-5">
            {atlasPreview}
          </div>
        </div>
      ) : null}
    </div>
  );
}
