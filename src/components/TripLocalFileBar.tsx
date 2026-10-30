"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FileDown, FolderOpen, Link2, Unlink, X, AlertCircle, Check } from "lucide-react";
import type { Trip } from "@/lib/types";
import {
  getTripFileLinkMeta,
  isFileSystemAccessSupported,
  tripLocalFileSession,
  type TripFileLinkState,
} from "@/lib/tripLocalFileAccess";
import { downloadTripFile } from "@/lib/tripLocalFileDocument";

const BANNER_DISMISS_PREFIX = "sniffertrek_file_banner_dismiss:";

const fileBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border px-3 sm:px-4 py-2.5 min-h-[2.75rem] text-sm font-medium leading-normal whitespace-normal text-center disabled:opacity-50";

type Props = {
  trip: Trip;
  onTripImported: (trip: Trip) => void;
  onFileWriteAfterBrowserSave: () => void;
};

export default function TripLocalFileBar({ trip, onTripImported, onFileWriteAfterBrowserSave }: Props) {
  const t = useTranslations("planer");
  const [linkState, setLinkState] = useState<TripFileLinkState>({ status: "none" });
  const [bannerOpen, setBannerOpen] = useState(false);
  const [fileBusy, setFileBusy] = useState(false);
  const lastTripIdRef = useRef(trip.id);
  const autoRestoreTried = useRef(false);

  const refreshState = useCallback(async () => {
    const state = await tripLocalFileSession.resolveLinkState(trip.id);
    setLinkState(state);
    if (state.status === "none") {
      const dismissed = typeof window !== "undefined" && localStorage.getItem(BANNER_DISMISS_PREFIX + trip.id);
      setBannerOpen(!dismissed);
    } else {
      setBannerOpen(false);
    }
  }, [trip.id]);

  useEffect(() => {
    if (lastTripIdRef.current !== trip.id) {
      lastTripIdRef.current = trip.id;
      autoRestoreTried.current = false;
    }
    void refreshState();
  }, [trip.id, refreshState]);

  useEffect(() => {
    if (linkState.status !== "needs_reconnect" || autoRestoreTried.current) return;
    autoRestoreTried.current = true;
    void tripLocalFileSession.tryRestoreLinkedFile(trip.id).then((restored) => {
      if (restored) setLinkState(restored);
    });
  }, [linkState.status, trip.id]);

  useEffect(() => {
    if (linkState.status !== "linked") return;
    tripLocalFileSession.scheduleWrite(trip);
    const timer = setTimeout(() => {
      void tripLocalFileSession.flushWrite(trip).then(setLinkState);
    }, 1600);
    return () => clearTimeout(timer);
  }, [trip, linkState.status]);

  const dismissBanner = () => {
    localStorage.setItem(BANNER_DISMISS_PREFIX + trip.id, "1");
    setBannerOpen(false);
  };

  const handleSaveAs = async () => {
    if (linkState.status === "needs_reconnect") {
      await handleReconnect();
      return;
    }
    setFileBusy(true);
    try {
      onFileWriteAfterBrowserSave();
      const state = await tripLocalFileSession.linkSaveAs(trip);
      setLinkState(state);
      if (state.status === "picker_failed") {
        window.alert(t("localFilePickerFailed"));
      } else {
        setBannerOpen(false);
      }
    } finally {
      setFileBusy(false);
    }
  };

  const handleOpen = async () => {
    setFileBusy(true);
    try {
      const imported = await tripLocalFileSession.openFileAsNewTrip();
      if (imported) {
        onTripImported(imported);
        const state = await tripLocalFileSession.resolveLinkState(imported.id);
        setLinkState(state);
      }
    } catch {
      window.alert(t("localFileInvalid"));
    } finally {
      setFileBusy(false);
    }
  };

  const handleReconnect = async () => {
    setFileBusy(true);
    try {
      onFileWriteAfterBrowserSave();
      const restored = await tripLocalFileSession.tryRestoreLinkedFile(trip.id);
      if (restored) {
        await tripLocalFileSession.flushWrite(trip);
        setLinkState(restored);
        return;
      }
      const state = await tripLocalFileSession.reconnectOpen(trip.id);
      if (state) {
        setLinkState(state);
      } else {
        window.alert(t("localFileReconnectFailed"));
      }
    } finally {
      setFileBusy(false);
    }
  };

  const handleDownloadBackup = () => {
    onFileWriteAfterBrowserSave();
    downloadTripFile(trip);
  };

  const handleUnlink = async () => {
    await tripLocalFileSession.unlink(trip.id);
    setLinkState({ status: "none" });
    setBannerOpen(true);
  };

  const fileNameForHint =
    linkState.status === "needs_reconnect" || linkState.status === "linked"
      ? linkState.fileName
      : getTripFileLinkMeta(trip.id)?.fileName ?? suggestFallbackName(trip);

  const showSafariHint =
    !isFileSystemAccessSupported() && linkState.status !== "linked";

  return (
    <>
      {bannerOpen && linkState.status === "none" && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 overflow-visible">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
            <p className="text-sm text-amber-950 leading-relaxed">{t("localFileBannerShort")}</p>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={fileBusy}
                onClick={() => void handleSaveAs()}
                className={`${fileBtn} bg-amber-600 text-white border-amber-700 hover:bg-amber-700`}
              >
                <FileDown className="w-4 h-4 shrink-0" aria-hidden />
                {t("localFileSaveAs")}
              </button>
              <button
                type="button"
                onClick={dismissBanner}
                className="inline-flex items-center gap-1 text-sm text-amber-800 hover:text-amber-950 px-2 py-2"
              >
                <X className="w-4 h-4" />
                {t("localFileBannerDismiss")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800 border-b border-slate-600/80 px-4 py-3 overflow-visible">
        <div className="max-w-7xl mx-auto flex flex-col gap-3 overflow-visible">
          <div className="min-w-0 text-sm text-slate-100 leading-relaxed">
            {linkState.status === "linked" && (
              <p className="flex flex-wrap items-start gap-2">
                <span className="inline-flex shrink-0 items-center gap-1 text-green-200 bg-green-500/20 px-2.5 py-1 rounded-md text-xs font-medium">
                  <Check className="w-3.5 h-3.5" />
                  {t("localFileLinkedShort")}
                </span>
                <span className="break-all font-medium" title={linkState.fileName}>
                  {linkState.fileName}
                </span>
              </p>
            )}
            {linkState.status === "needs_reconnect" && (
              <div className="space-y-2 rounded-lg bg-amber-500/15 border border-amber-400/30 px-3 py-2.5">
                <p className="font-medium text-amber-50">{t("localFileReconnectTitle")}</p>
                <p className="text-amber-100/95 text-xs sm:text-sm leading-relaxed">
                  {t("localFileReconnectSteps", { name: fileNameForHint })}
                </p>
              </div>
            )}
            {linkState.status === "write_failed" && (
              <p className="text-red-100">{t("localFileWriteFailed")}</p>
            )}
            {linkState.status === "picker_failed" && (
              <p className="text-amber-100">{t("localFilePickerFailedInline")}</p>
            )}
            {linkState.status === "none" && (
              <p className="text-slate-300">{t("localFileNotLinked")}</p>
            )}
            {showSafariHint && (
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">{t("localFileSafariHint")}</p>
            )}
          </div>
          <div className="flex flex-wrap items-stretch gap-2 overflow-visible">
            <button
              type="button"
              disabled={fileBusy}
              onClick={() => void handleSaveAs()}
              className={`${fileBtn} ${
                linkState.status === "needs_reconnect"
                  ? "bg-amber-500 hover:bg-amber-400 text-white border-amber-600"
                  : "bg-white/10 hover:bg-white/15 text-white border-white/20"
              }`}
            >
              {linkState.status === "needs_reconnect" ? (
                <Link2 className="w-4 h-4 shrink-0" aria-hidden />
              ) : (
                <FileDown className="w-4 h-4 shrink-0" aria-hidden />
              )}
              {linkState.status === "needs_reconnect" ? t("localFileReconnect") : t("localFileSaveAs")}
            </button>
            {linkState.status === "linked" && (
              <button
                type="button"
                disabled={fileBusy}
                onClick={() => void handleReconnect()}
                className={`${fileBtn} bg-white/10 hover:bg-white/15 text-white border-white/20`}
                title={t("localFileReconnectTitle")}
              >
                <Link2 className="w-4 h-4 shrink-0" aria-hidden />
                {t("localFileRelink")}
              </button>
            )}
            <button
              type="button"
              disabled={fileBusy}
              onClick={() => void handleOpen()}
              className={`${fileBtn} bg-white/10 hover:bg-white/15 text-white border-white/20`}
            >
              <FolderOpen className="w-4 h-4 shrink-0" aria-hidden />
              {t("localFileOpen")}
            </button>
            <button
              type="button"
              disabled={fileBusy}
              onClick={handleDownloadBackup}
              className={`${fileBtn} bg-white/10 hover:bg-white/15 text-white border-white/20`}
              title={t("localFileDownloadTitle")}
            >
              <FileDown className="w-4 h-4 shrink-0" aria-hidden />
              {t("localFileDownload")}
            </button>
            {(linkState.status === "linked" || linkState.status === "needs_reconnect") && (
              <button
                type="button"
                disabled={fileBusy}
                onClick={() => void handleUnlink()}
                className="inline-flex items-center justify-center min-h-[2.75rem] px-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                title={t("localFileUnlinkTitle")}
              >
                <Unlink className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function suggestFallbackName(trip: Trip): string {
  const base = trip.name && trip.name !== "Neue Reise" ? trip.name : "SnifferTrek-Reise";
  return `${base}.sniffertrek.json`;
}
