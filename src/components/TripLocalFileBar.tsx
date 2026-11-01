"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FileDown, FolderOpen, Link2, Unlink, X, Check, ChevronDown } from "lucide-react";
import type { Trip } from "@/lib/types";
import {
  consumeTripFileJustOpened,
  disableSafariSaveHintForever,
  getTripFileLinkMeta,
  isFileSystemAccessSupported,
  isLinkedFileAutoSaveReliable,
  isSafariBrowser,
  markSafariSaveHintShown,
  freezeTripForFile,
  markTripFileJustOpened,
  markTripSavedToFile,
  saveTripToChosenHandle,
  startSaveFilePickerInUserGesture,
  SAFARI_SAVE_HINT_INTERVAL_MS,
  shouldShowSafariSaveHint,
  tripLocalFileSession,
  type TripFileLinkState,
} from "@/lib/tripLocalFileAccess";
import { downloadTripFileAsync, suggestTripFileName } from "@/lib/tripLocalFileDocument";

const BANNER_DISMISS_PREFIX = "sniffertrek_file_banner_dismiss:";
const TOAST_AUTO_HIDE_MS = 10000;

type Props = {
  trip: Trip;
  /** Optional: immer frischeste Trip-Kopie (vermeidet Stale-Closure beim Speichern). */
  getLatestTrip?: () => Trip;
  /** Nur bei echten Edits auto-schreiben – nicht direkt nach Datei öffnen. */
  hasUnsavedChanges?: boolean;
  onTripImported: (trip: Trip) => void;
  onFileWriteAfterBrowserSave: () => void;
  /** Nach erfolgreichem Datei-Speichern (unsaved zurücksetzen). */
  onFileSaveComplete?: () => void;
};

export default function TripLocalFileBar({
  trip,
  getLatestTrip,
  hasUnsavedChanges = false,
  onTripImported,
  onFileWriteAfterBrowserSave,
  onFileSaveComplete,
}: Props) {
  const t = useTranslations("planer");
  const [linkState, setLinkState] = useState<TripFileLinkState>({ status: "none" });
  const [bannerOpen, setBannerOpen] = useState(false);
  const [fileBusy, setFileBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [safariHintOpen, setSafariHintOpen] = useState(false);
  /** Bekannte Datei + Seitenladen ohne «Datei öffnen» → Hinweis statt stiller Cache. */
  const [needsFileOpen, setNeedsFileOpen] = useState(false);
  const lastTripIdRef = useRef(trip.id);
  const tripRef = useRef(trip);
  tripRef.current = trip;
  const latestTrip = () => getLatestTrip?.() ?? tripRef.current;
  const autoRestoreTried = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileBusyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setFileBusySafe = useCallback((busy: boolean) => {
    if (fileBusyTimerRef.current) {
      clearTimeout(fileBusyTimerRef.current);
      fileBusyTimerRef.current = null;
    }
    setFileBusy(busy);
    if (busy) {
      // Permission/Picker darf den Button nicht dauerhaft sperren
      fileBusyTimerRef.current = setTimeout(() => setFileBusy(false), 20000);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (fileBusyTimerRef.current) clearTimeout(fileBusyTimerRef.current);
    };
  }, []);

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
    const meta = getTripFileLinkMeta(trip.id);
    const justOpened = consumeTripFileJustOpened(trip.id);
    setNeedsFileOpen(!!meta && !justOpened);
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
    // Nicht beim bloßen Öffnen / nicht mit scheduleWrite (sonst überschreibt ein alter Snapshot).
    if (!hasUnsavedChanges) return;
    const timer = setTimeout(() => {
      void tripLocalFileSession.flushWrite(freezeTripForFile(latestTrip())).then(setLinkState);
    }, 2000);
    return () => clearTimeout(timer);
  }, [trip, linkState.status, hasUnsavedChanges]);

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

  const markSaved = (fileName: string) => {
    markTripSavedToFile(latestTrip().id, fileName);
    markTripFileJustOpened(latestTrip().id);
    setNeedsFileOpen(false);
    setBannerOpen(false);
    onFileSaveComplete?.();
  };

  const showSaveFeedback = (result: Awaited<ReturnType<typeof saveTripToChosenHandle>>) => {
    if (result.outcome === "linked" && result.linkState.status === "linked") {
      markSaved(result.linkState.fileName);
      setSaveToast(t("localFileSavedLinked", { name: result.linkState.fileName }));
    } else if (result.outcome === "download") {
      const name = result.fileName ?? suggestTripFileName(latestTrip());
      markSaved(name);
      setSaveToast(t("localFileSavedDownloadNextOpen", { name }));
    } else if (result.outcome === "failed") {
      setSaveToast(t("localFilePickerFailed"));
    }
  };

  /** Safari: zuerst Browser-Kopie, dann ZIP aus demselben Stand; Toast erst nach Download. */
  const runSafariDownloadSave = () => {
    onFileWriteAfterBrowserSave();
    const frozen = freezeTripForFile(latestTrip());
    const name = suggestTripFileName(frozen);
    const downloadPromise = downloadTripFileAsync(frozen, name);
    setMenuOpen(false);
    setFileBusySafe(true);
    void downloadPromise
      .then(() => {
        markSaved(name);
        setSaveToast(
          t("localFileSavedDownloadNextOpen", {
            name: `${name} · ${frozen.stops?.length || 0} Stopps`,
          })
        );
      })
      .catch((err) => {
        console.warn("[TripLocalFileBar] safari download failed", err);
        setSaveToast(t("localFileSaveFailed"));
      })
      .finally(() => setFileBusySafe(false));
  };

  const runSaveFilePicker = () => {
    onFileWriteAfterBrowserSave();
    const frozen = freezeTripForFile(latestTrip());
    if (isSafariBrowser() || !isFileSystemAccessSupported()) {
      // Browser-Kopie schon geschrieben – Download mit frozen
      const name = suggestTripFileName(frozen);
      const downloadPromise = downloadTripFileAsync(frozen, name);
      setMenuOpen(false);
      setFileBusySafe(true);
      void downloadPromise
        .then(() => {
          markSaved(name);
          setSaveToast(
            t("localFileSavedDownloadNextOpen", {
              name: `${name} · ${frozen.stops?.length || 0} Stopps`,
            })
          );
        })
        .catch((err) => {
          console.warn("[TripLocalFileBar] download failed", err);
          setSaveToast(t("localFileSaveFailed"));
        })
        .finally(() => setFileBusySafe(false));
      return;
    }

    const started = startSaveFilePickerInUserGesture(frozen);
    setMenuOpen(false);
    if (started.kind === "unsupported") {
      runSafariDownloadSave();
      return;
    }

    setFileBusySafe(true);
    void started.promise
      .then((handle) =>
        saveTripToChosenHandle(frozen, handle, tripLocalFileSession, undefined)
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
      .finally(() => setFileBusySafe(false));
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
      setFileBusySafe(true);
      void (async () => {
        let handedOffToPicker = false;
        try {
          // Zuerst localStorage (Union beim ZIP-Bau kann Stopps nachziehen)
          onFileWriteAfterBrowserSave();
          const frozen = freezeTripForFile(latestTrip());
          const state = await tripLocalFileSession.flushWrite(frozen);
          setLinkState(state);
          if (state.status === "linked") {
            markSaved(state.fileName);
            setSaveToast(
              t("localFileSavedLinked", {
                name: `${state.fileName} · ${frozen.stops?.length || 0} Stopps`,
              })
            );
            return;
          }
          if (state.status === "write_failed") {
            setSaveToast(t("localFileWriteFailed"));
            return;
          }
          handedOffToPicker = true;
          setFileBusySafe(false);
          runSaveFilePicker();
        } finally {
          if (!handedOffToPicker) setFileBusySafe(false);
        }
      })();
      return;
    }

    runSaveFilePicker();
  };

  const handleOpen = async () => {
    setFileBusySafe(true);
    try {
      const imported = await tripLocalFileSession.openFileAsNewTrip();
      if (imported) {
        setNeedsFileOpen(false);
        onTripImported(imported);
        const state = await tripLocalFileSession.resolveLinkState(imported.id);
        setLinkState(state);
      }
    } catch {
      window.alert(t("localFileInvalid"));
    } finally {
      setFileBusySafe(false);
    }
  };

  const continueWithBrowserCopy = () => {
    setNeedsFileOpen(false);
  };

  const handleReconnect = async () => {
    setFileBusySafe(true);
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
      setFileBusySafe(false);
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

  const showIntroBanner = bannerOpen && linkState.status === "none" && !needsFileOpen;
  const showRelinkActions = isFileSystemAccessSupported();
  const knownFileName = getTripFileLinkMeta(trip.id)?.fileName ?? fileNameForHint;

  const menuItemClass =
    "flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-50 text-left";

  return (
    <>
      {needsFileOpen && (
        <div className="border-b border-sky-300 bg-sky-50 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-sm text-sky-950 leading-relaxed">
              <p className="font-semibold">{t("localFileTruthTitle")}</p>
              <p className="mt-0.5 text-sky-900/90">
                {t("localFileTruthBody", { name: knownFileName })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={fileBusy}
                onClick={() => void handleOpen()}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-700 hover:bg-sky-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                <FolderOpen className="w-4 h-4 shrink-0" aria-hidden />
                {t("localFileOpen")}
              </button>
              <button
                type="button"
                onClick={continueWithBrowserCopy}
                className="inline-flex items-center gap-1 rounded-xl border border-sky-300 bg-white/80 px-3 py-2 text-xs font-medium text-sky-900 hover:bg-white"
              >
                {t("localFileUseBrowserCopy")}
              </button>
            </div>
          </div>
        </div>
      )}

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
            {!needsFileOpen && linkState.status === "linked" && (
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
            {!needsFileOpen && linkState.status === "needs_reconnect" && showRelinkActions && (
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
              <div className="inline-flex rounded-xl shadow-sm overflow-hidden border border-blue-700">
                <button
                  type="button"
                  disabled={fileBusy}
                  onClick={() => handleSaveToFile()}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  <FileDown className="w-4 h-4 shrink-0" aria-hidden />
                  {t("localFileSaveMenu")}
                </button>
                <button
                  type="button"
                  disabled={fileBusy}
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  aria-label={t("localFileSaveMenu")}
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700 border-l border-blue-500 px-2 py-2 text-white disabled:opacity-50"
                >
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </div>

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
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={fileBusy}
              onClick={() => {
                setSafariHintOpen(false);
                handleSaveToFile();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-amber-50 hover:bg-amber-950 disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5" />
              {t("localFileSaveAs")}
            </button>
            <button
              type="button"
              onClick={() => {
                disableSafariSaveHintForever();
                setSafariHintOpen(false);
              }}
              className="text-xs font-medium text-amber-800 hover:text-amber-950 underline"
            >
              {t("localFileSafariToastDismissForever")}
            </button>
          </div>
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
