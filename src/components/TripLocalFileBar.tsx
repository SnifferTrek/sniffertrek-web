"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FileDown, FolderOpen, Link2, Unlink, X, Check, ChevronDown } from "lucide-react";
import type { Trip } from "@/lib/types";
import {
  disableSafariSaveHintForever,
  getTripFileLinkMeta,
  isFileSystemAccessSupported,
  isLinkedFileAutoSaveReliable,
  isSafariBrowser,
  markSafariSaveHintShown,
  saveTripToChosenHandle,
  startSaveFilePickerInUserGesture,
  SAFARI_SAVE_HINT_INTERVAL_MS,
  shouldShowSafariSaveHint,
  tripLocalFileSession,
  type TripFileLinkState,
} from "@/lib/tripLocalFileAccess";
import { downloadTripFile, suggestTripFileName } from "@/lib/tripLocalFileDocument";

const BANNER_DISMISS_PREFIX = "sniffertrek_file_banner_dismiss:";
const TOAST_AUTO_HIDE_MS = 8000;

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
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [safariHintOpen, setSafariHintOpen] = useState(false);
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
    if (isSafariBrowser()) return;
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

  const openSafariHintIfDue = useCallback(() => {
    if (linkState.status === "linked" || !isSafariBrowser()) return;
    if (!shouldShowSafariSaveHint()) return;
    markSafariSaveHintShown();
    setSafariHintOpen(true);
  }, [linkState.status]);

  useEffect(() => {
    if (!isSafariBrowser()) return;
    openSafariHintIfDue();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") openSafariHintIfDue();
    }, SAFARI_SAVE_HINT_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [openSafariHintIfDue]);

  useEffect(() => {
    if (!saveToast) return;
    const id = window.setTimeout(() => setSaveToast(null), TOAST_AUTO_HIDE_MS);
    return () => window.clearTimeout(id);
  }, [saveToast]);

  const dismissBanner = () => {
    localStorage.setItem(BANNER_DISMISS_PREFIX + trip.id, "1");
    setBannerOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  const showSaveFeedback = (result: Awaited<ReturnType<typeof saveTripToChosenHandle>>) => {
    if (result.outcome === "linked" && result.linkState.status === "linked") {
      setSaveToast(t("localFileSavedLinked", { name: result.linkState.fileName }));
      setBannerOpen(false);
    } else if (result.outcome === "download") {
      setSaveToast(t("localFileSavedDownload", { name: result.fileName ?? "" }));
      setBannerOpen(false);
    } else if (result.outcome === "failed") {
      setSaveToast(t("localFilePickerFailed"));
    }
  };

  /** Safari: echter Download (achtet «Für jeden Download fragen»), kein Teilen-Sheet. */
  const runSafariDownloadSave = () => {
    const name = suggestTripFileName(trip);
    // Download zuerst – vor setState, damit Safari «Für jeden Download fragen» greift.
    downloadTripFile(trip, name);
    onFileWriteAfterBrowserSave();
    setMenuOpen(false);
    setBannerOpen(false);
    setSaveToast(t("localFileSavedDownloadSafari", { name }));
  };

  const handleSaveToFile = () => {
    if (linkState.status === "needs_reconnect") {
      setMenuOpen(false);
      void handleReconnect();
      return;
    }

    const useSilentFlush =
      linkState.status === "linked" && !isSafariBrowser() && isLinkedFileAutoSaveReliable();

    if (useSilentFlush) {
      setMenuOpen(false);
      setFileBusy(true);
      void (async () => {
        try {
          onFileWriteAfterBrowserSave();
          const state = await tripLocalFileSession.flushWrite(trip);
          setLinkState(state);
          if (state.status === "linked") {
            setSaveToast(t("localFileSavedLinked", { name: state.fileName }));
          } else if (state.status === "write_failed") {
            setSaveToast(t("localFileWriteFailed"));
          }
        } finally {
          setFileBusy(false);
        }
      })();
      return;
    }

    // Safari / ohne File-Picker: Download – bei «Für jeden Download fragen» erscheint der Speicherort-Dialog.
    if (isSafariBrowser() || !isFileSystemAccessSupported()) {
      runSafariDownloadSave();
      return;
    }

    const started = startSaveFilePickerInUserGesture(trip);
    setMenuOpen(false);
    if (started.kind === "unsupported") {
      runSafariDownloadSave();
      return;
    }

    setFileBusy(true);
    void started.promise
      .then((handle) =>
        saveTripToChosenHandle(trip, handle, tripLocalFileSession, onFileWriteAfterBrowserSave)
      )
      .then((result) => {
        setLinkState(result.linkState);
        showSaveFeedback(result);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.warn("[TripLocalFileBar] save picker failed", err);
        setSaveToast(t("localFilePickerFailed"));
      })
      .finally(() => setFileBusy(false));
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

  const showIntroBanner = bannerOpen && linkState.status === "none";
  const showRelinkActions = isFileSystemAccessSupported();

  const menuItemClass =
    "flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-50 text-left";

  return (
    <>
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
            {linkState.status === "needs_reconnect" && showRelinkActions && (
              <p className="text-amber-900 text-xs sm:text-sm">
                {t("localFileReconnectSteps", { name: fileNameForHint })}
              </p>
            )}
            {linkState.status === "write_failed" && (
              <p className="text-red-700 text-sm">{t("localFileWriteFailed")}</p>
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
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-1.5 min-w-[15rem] rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                >
                  {linkState.status === "needs_reconnect" && showRelinkActions ? (
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
                      onClick={() => handleSaveToFile()}
                    >
                      <FileDown className="w-4 h-4 shrink-0 text-gray-500" />
                      {t("localFileSaveAs")}
                    </button>
                  )}
                  {linkState.status === "linked" && showRelinkActions && (
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
                  {(linkState.status === "linked" || linkState.status === "needs_reconnect") && showRelinkActions && (
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

      {safariHintOpen && (
        <div
          role="status"
          className="fixed bottom-6 left-4 right-4 z-[100] mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg sm:left-auto sm:right-6"
        >
          <div className="flex gap-3 items-start">
            <p className="text-sm text-amber-950 leading-relaxed flex-1">{t("localFileSafariToast")}</p>
            <button
              type="button"
              onClick={() => setSafariHintOpen(false)}
              className="shrink-0 p-1 text-amber-800 hover:text-amber-950"
              aria-label={t("localFileSafariToastClose")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              disableSafariSaveHintForever();
              setSafariHintOpen(false);
            }}
            className="mt-2 text-xs font-medium text-amber-800 hover:text-amber-950 underline"
          >
            {t("localFileSafariToastDismissForever")}
          </button>
        </div>
      )}

      {saveToast && (
        <div
          role="status"
          className="fixed bottom-6 left-4 right-4 z-[100] mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 shadow-lg sm:left-auto sm:right-6"
        >
          <div className="flex gap-3 items-start">
            <p className="flex-1 leading-relaxed">{saveToast}</p>
            <button
              type="button"
              onClick={() => setSaveToast(null)}
              className="shrink-0 p-1 text-gray-500 hover:text-gray-800"
              aria-label={t("localFileSafariToastClose")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function suggestFallbackName(trip: Trip): string {
  const base = trip.name && trip.name !== "Neue Reise" ? trip.name : "SnifferTrek-Reise";
  return `${base}.sniffertrek.json`;
}
