"use client";

import { Printer } from "lucide-react";
import { printTravelReport } from "@/lib/printTravelReport";

type TravelReportPrintButtonProps = {
  label?: string;
  className?: string;
};

export default function TravelReportPrintButton({
  label = "Drucken / als PDF speichern",
  className,
}: TravelReportPrintButtonProps) {
  const handlePrint = () => {
    if (typeof window === "undefined") return;
    const prevTitle = document.title;
    document.title = "";

    const restoreTitle = () => {
      document.title = prevTitle;
    };

    void printTravelReport().finally(restoreTitle);
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      className={
        className ??
        "no-print inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-stone-400 hover:bg-stone-50"
      }
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
