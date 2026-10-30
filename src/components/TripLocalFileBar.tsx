"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FileDown, FolderOpen, Link2, Unlink, X, Check, ChevronDown } from "lucide-react";
import type { Trip } from "@/lib/types";
import {
  getTripFileLinkMeta,
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
  const [menuOpen, setMenuOpen] = useState(false);
  const lastTripIdRef = useRef(trip.id);
  const autoRestoreTried = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  const dismissBanner = () => {
    localStorage.setItem(BANNER_DISMISS_PREFIX + trip.id, "1");
    setBannerOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

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

  const runMenuAction = (fn: () => void | Promise<void>) => {
    closeMenu();
    void fn();
  };

  const fileNameForHint =
    linkState.status === "needs_reconnect" || linkState.status === "linked"
      ? linkState.fileName
      : getTripFileLinkMeta(trip.id)?.fileName ?? suggestFallbackName(trip);

  const showSafariHint =
    !isFileSystemAccessSupported() && linkState.status !== "linked";

  const menuItemClass =
    "flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-50 text-left";

  const showIntroBanner = bannerOpen && linkState.status === "none";

  return (
      <div
        className={`border-b px-4 py-2.5 ${
          showIntroBanner ? "bg-amber-50 border-amber-200" : "bg-gray-50/90 border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-2 justify-between">
          <div className="min-w-0 flex-1 text-sm leading-snug">
            {showIntroBanner && (
              <p className="text-sm text-amber-950 leading-relaxed">{t("localFileBannerShort")}</p>
            )}
            {linkState.status === "linked" && (
              <p className="flex flex-wrap items-center gap-2 text-gray-600">
                <span className="inline-flex shrink-0 items-center gap-1 text-green-800 bg-green-100 px-2 py-0.5 rounded-md text-xs font-medium">
                  <Check className="w-3.5 h-3.5" />
                  {t("localFileLinkedShort")}
                </span>
                <span className="truncate max-w-[min(100%,28rem)] font-medium text-gray-800" title={linkState.fileName}>
                  {linkState.fileName}
                </span>
              </p>
            )}
            {linkState.status === "needs_reconnect" && (
              <p className="text-amber-900 text-xs sm:text-sm">
                {t("localFileReconnectSteps", { name: fileNameForHint })}
              </p>
            )}
            {linkState.status === "write_failed" && (
              <p className="text-red-700 text-sm">{t("localFileWriteFailed")}</p>
            )}
            {linkState.status === "picker_failed" && (
              <p className="text-amber-800 text-sm">{t("localFilePickerFailedInline")}</p>
            )}
            {showSafariHint && linkState.status === "none" && !showIntroBanner && (
              <p className="text-xs text-gray-500">{t("localFileSafariHint")}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
          {showIntroBanner && (
            <button
              type="button"
              onClick={dismissBanner}
              className="inline-flex items-center gap-1 text-sm text-amber-800 hover:text-amber-950 px-2 py-2"
            >
              <X className="w-4 h-4" />
              {t("localFileBannerDismiss")}
            </button>
          )}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              disabled={fileBusy}
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4 text-gray-600 shrink-0" aria-hidden />
              {t("localFileSaveMenu")}
              <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-1.5 min-w-[15rem] rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
              >
                {linkState.status === "needs_reconnect" ? (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={fileBusy}
                    className={`${menuItemClass} font-medium text-amber-900 hover:bg-amber-50`}
                    onClick={() => runMenuAction(handleReconnect)}
                  >
                    <Link2 className="w-4 h-4 shrink-0 text-amber-700" />
                    {t("localFileReconnect")}
                  </button>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={fileBusy}
                    className={menuItemClass}
                    onClick={() => runMenuAction(handleSaveAs)}
                  >
                    <FileDown className="w-4 h-4 shrink-0 text-gray-500" />
                    {t("localFileSaveAs")}
                  </button>
                )}
                {linkState.status === "linked" && (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={fileBusy}
                    className={menuItemClass}
                    onClick={() => runMenuAction(handleReconnect)}
                  >
                    <Link2 className="w-4 h-4 shrink-0 text-gray-500" />
                    {t("localFileRelink")}
                  </button>
                )}
                <button
                  type="button"
                  role="menuitem"
                  disabled={fileBusy}
                  className={menuItemClass}
                  onClick={() => runMenuAction(handleOpen)}
                >
                  <FolderOpen className="w-4 h-4 shrink-0 text-gray-500" />
                  {t("localFileOpen")}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={fileBusy}
                  className={menuItemClass}
                  onClick={() => runMenuAction(handleDownloadBackup)}
                  title={t("localFileDownloadTitle")}
                >
                  <FileDown className="w-4 h-4 shrink-0 text-gray-500" />
                  {t("localFileDownload")}
                </button>
                {(linkState.status === "linked" || linkState.status === "needs_reconnect") && (
                  <>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      type="button"
                      role="menuitem"
                      disabled={fileBusy}
                      className={`${menuItemClass} text-gray-600`}
                      onClick={() => runMenuAction(handleUnlink)}
                      title={t("localFileUnlinkTitle")}
                    >
                      <Unlink className="w-4 h-4 shrink-0" />
                      {t("localFileUnlink")}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
  );
}

function suggestFallbackName(trip: Trip): string {
  const base = trip.name && trip.name !== "Neue Reise" ? trip.name : "SnifferTrek-Reise";
  return `${base}.sniffertrek.json`;
}
