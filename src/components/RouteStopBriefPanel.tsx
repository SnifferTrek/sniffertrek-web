"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, ImagePlus, Info, Loader2, RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { RouteStop } from "@/lib/types";
import { roleLabel, stopHasBriefContent } from "@/lib/stopBrief";

type RouteStopBriefPanelProps = {
  stop: RouteStop;
  expanded: boolean;
  onToggleExpand: () => void;
  loading: boolean;
  onLoadBrief: () => void;
  included: boolean;
  onSetIncluded: (included: boolean) => void;
  onClearBrief: () => void;
  onSaveDescription: (text: string) => void;
  onPhotoDataUrl: (dataUrl: string | undefined) => void;
  onReloadPhoto: () => void;
  onAlternatePhoto: () => void;
  imageUrlToDataUrl: (url: string) => Promise<string | undefined>;
  fileToDataUrl: (file: File) => Promise<string | undefined>;
  /** Im Tab «Ortsinfos»: ohne Einklapp-Zeile unter der Route. */
  layout?: "nested" | "card";
};

export default function RouteStopBriefPanel({
  stop,
  expanded,
  onToggleExpand,
  loading,
  onLoadBrief,
  included,
  onSetIncluded,
  onClearBrief,
  onSaveDescription,
  onPhotoDataUrl,
  onReloadPhoto,
  onAlternatePhoto,
  imageUrlToDataUrl,
  fileToDataUrl,
  layout = "nested",
}: RouteStopBriefPanelProps) {
  const locale = useLocale();
  const tt = useTranslations("planerTabs");
  const [draft, setDraft] = useState(stop.discoveryDescription || "");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(stop.discoveryDescription || "");
  }, [stop.id, stop.discoveryDescription]);
  const hasContent = stopHasBriefContent(stop);
  const photoSrc = stop.discoveryPhotoDataUrl || stop.discoveryPhotoUrl;

  const showBody = layout === "card" || expanded;

  return (
    <div className={layout === "card" ? "mb-2" : "ml-9 mr-1 -mt-0.5 mb-1"}>
      {layout === "nested" && (
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800"
        >
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>
            {hasContent ? tt("stopBriefLabel") : tt("stopBriefAdd")}
            {hasContent ? ` · ${roleLabel(stop, locale)}` : ""}
          </span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
        </button>
      )}

      {showBody && (
        <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50/80 p-3 space-y-3">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={included}
              onChange={(e) => onSetIncluded(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            {tt("includeInReport")}
          </label>
          {stop.lat == null || stop.lng == null ? (
            <p className="text-[10px] text-amber-700">{tt("stopBriefNoCoords")}</p>
          ) : null}
          <div
            className={`flex gap-4 ${layout === "card" ? "flex-col" : "flex-col sm:flex-row"}`}
          >
            <div className={layout === "card" ? "w-full" : "shrink-0"}>
              {photoSrc ? (
                <img
                  src={photoSrc}
                  alt=""
                  className="h-48 w-full max-w-md rounded-lg object-cover border border-gray-200 bg-white"
                />
              ) : (
                <div className="flex h-48 w-full max-w-md items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-[10px] text-gray-400">
                  {tt("noImage")}
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <label className="flex flex-1 min-w-[7rem] cursor-pointer items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-medium text-gray-600 hover:border-blue-300">
                  <ImagePlus className="h-3.5 w-3.5" />
                  {tt("ownImage")}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.currentTarget.value = "";
                      if (!file) return;
                      void fileToDataUrl(file).then((url) => onPhotoDataUrl(url));
                    }}
                  />
                </label>
                <button
                  type="button"
                  disabled={loading || !stop.name.trim()}
                  onClick={onReloadPhoto}
                  className="flex-1 min-w-[7rem] rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-medium text-gray-600 hover:border-blue-300 disabled:opacity-50"
                >
                  {tt("reloadPhoto")}
                </button>
                <button
                  type="button"
                  disabled={loading || !stop.name.trim()}
                  onClick={onAlternatePhoto}
                  className="flex-1 min-w-[7rem] rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-medium text-gray-600 hover:border-blue-300 disabled:opacity-50"
                >
                  {tt("altPhoto")}
                </button>
              </div>
            </div>
            <div className="min-w-0 w-full flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-600">{tt("stopBriefLabel")}</label>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => {
                  const trimmed = draft.trim();
                  if (trimmed !== (stop.discoveryDescription || "").trim()) {
                    onSaveDescription(trimmed);
                  }
                }}
                rows={7}
                placeholder={tt("placeInfoPlaceholder")}
                className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm leading-relaxed text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading || !stop.name.trim()}
              onClick={onLoadBrief}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {tt("loadInfo")}
            </button>
            {hasContent && (
              <button
                type="button"
                onClick={onClearBrief}
                className="text-xs text-red-600 hover:underline"
              >
                {tt("removePlaceInfo")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
