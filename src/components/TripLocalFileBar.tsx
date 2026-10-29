"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FileDown, FolderOpen, Link2, Unlink, X, AlertCircle, Check } from "lucide-react";
import type { Trip } from "@/lib/types";
import {
  isFileSystemAccessSupported,
  tripLocalFileSession,
  type TripFileLinkState,
} from "@/lib/tripLocalFileAccess";
import { downloadTripFile } from "@/lib/tripLocalFileDocument";

const BANNER_DISMISS_PREFIX = "sniffertrek_file_banner_dismiss:";

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
    }
    void refreshState();
  }, [trip.id, refreshState]);

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
    setFileBusy(true);
    try {
      onFileWriteAfterBrowserSave();
      const state = await tripLocalFileSession.linkSaveAs(trip);
      setLinkState(state);
      setBannerOpen(false);
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

  const fsaHint = !isFileSystemAccessSupported() ? t("localFileSafariHint") : null;

  return (
    <>
      {bannerOpen && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <p className="text-sm text-amber-950">{t("localFileBanner")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={fileBusy}
                onClick={() => void handleSaveAs()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
              >
                <FileDown className="w-4 h-4" />
                {t("localFileSaveAs")}
              </button>
              <button
                type="button"
                onClick={dismissBanner}
                className="inline-flex items-center gap-1 text-sm text-amber-800 hover:text-amber-950"
              >
                <X className="w-4 h-4" />
                {t("localFileBannerDismiss")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900/90 border-b border-white/10 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
            {linkState.status === "linked" && (
              <span className="inline-flex items-center gap-1 text-green-200 bg-green-500/15 px-2 py-1 rounded-md">
                <Check className="w-3.5 h-3.5" />
                {t("localFileLinked", { name: linkState.fileName })}
              </span>
            )}
            {linkState.status === "needs_reconnect" && (
              <span className="inline-flex items-center gap-1 text-amber-200 bg-amber-500/15 px-2 py-1 rounded-md">
                <AlertCircle className="w-3.5 h-3.5" />
                {t("localFileNeedsReconnect", { name: linkState.fileName })}
              </span>
            )}
            {linkState.status === "write_failed" && (
              <span className="inline-flex items-center gap-1 text-red-200 bg-red-500/15 px-2 py-1 rounded-md">
                <AlertCircle className="w-3.5 h-3.5" />
                {t("localFileWriteFailed")}
              </span>
            )}
            {linkState.status === "none" && (
              <span className="text-slate-400">{t("localFileNotLinked")}</span>
            )}
            {fsaHint && <span className="text-slate-500">{fsaHint}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={fileBusy}
              onClick={() => void handleSaveAs()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white px-3 py-1.5 text-xs font-medium border border-white/15 disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5" />
              {t("localFileSaveAs")}
            </button>
            <button
              type="button"
              disabled={fileBusy}
              onClick={() => void handleOpen()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white px-3 py-1.5 text-xs font-medium border border-white/15 disabled:opacity-50"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              {t("localFileOpen")}
            </button>
            {linkState.status === "needs_reconnect" && (
              <button
                type="button"
                disabled={fileBusy}
                onClick={() => void handleReconnect()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-white px-3 py-1.5 text-xs font-medium disabled:opacity-50"
              >
                <Link2 className="w-3.5 h-3.5" />
                {t("localFileReconnect")}
              </button>
            )}
            <button
              type="button"
              disabled={fileBusy}
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white px-3 py-1.5 text-xs font-medium border border-white/15 disabled:opacity-50"
              title={t("localFileDownloadTitle")}
            >
              <FileDown className="w-3.5 h-3.5" />
              {t("localFileDownload")}
            </button>
            {(linkState.status === "linked" || linkState.status === "needs_reconnect") && (
              <button
                type="button"
                disabled={fileBusy}
                onClick={() => void handleUnlink()}
                className="inline-flex items-center gap-1.5 rounded-lg text-slate-400 hover:text-white px-2 py-1.5 text-xs"
                title={t("localFileUnlinkTitle")}
              >
                <Unlink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
