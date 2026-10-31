"use client";

import { useState, useEffect, useCallback, useRef, useMemo, Fragment, type ChangeEvent } from "react";
import {
  MapPin,
  Hotel,
  Plane,
  Car,
  Train,
  Navigation,
  Plus,
  X,
  Calendar,
  Users,
  Search,
  ArrowRight,
  Flag,
  ChevronDown,
  Star,
  ExternalLink,
  Compass,
  Map,
  Sparkles,
  FolderOpen,
  Trash2,
  Check,
  BookmarkPlus,
  Smartphone,
  Shield,
  Globe,
  Zap,
  BedDouble,
  Clock,
  Route,
  GripVertical,
  ChevronRight,
  ChevronLeft,
  ArrowDownUp,
  FileDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Loader2,
  Settings,
  Pencil,
  Info,
  FileUp,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import RouteStopBriefPanel from "@/components/RouteStopBriefPanel";
import MediaImg from "@/components/MediaImg";
import {
  stopHasBriefContent,
  stopBriefIncluded,
  roleLabel,
  isUserUploadedStopPhoto,
} from "@/lib/stopBrief";
import { asAppLocale } from "@/lib/localeCopy";
import {
  wikipediaSummaryUrls,
  wikipediaIntroExtractUrls,
  wikipediaOpenSearchUrls,
  wikipediaGeosearchUrls,
  wikipediaArticleUrl,
} from "@/lib/wikipediaLocale";
import {
  Trip,
  TravelMode,
  TravelInterest,
  AiPoiSuggestion,
  RouteStop,
  BucketListItem,
  RouteLegInfo,
  Etappe,
  TripModule,
  TransportModule,
  ViaPoint,
  PdfPhotoPlacement,
  PdfPhotoLayout,
} from "@/lib/types";
import { fetchAiPois } from "@/lib/aiPoiService";
import {
  createNewTrip,
  saveTrip,
  getAllTrips,
  getTrip,
  loadTripHydrated,
  deleteTrip,
  getActiveTripId,
  setActiveTripId,
  getTripDisplayName,
  formatDate,
  markStopsDeleted,
  TRIPS_MERGED_EVENT,
} from "@/lib/tripStorage";
import {
  applyPdfMediaToTrip,
  hydrateTripMedia,
  loadDurablePdfMedia,
  readTripCoverPhoto,
  removeTripCoverPhoto,
  writeTripCoverPhoto,
  writeStopPhotoToSidecar,
  removeStopPhotoFromSidecar,
  loadDurableStopMedia,
} from "@/lib/tripMediaSidecar";
import { mergeTripRecords, preserveStopPhotos, syncTripRouteStops } from "@/lib/tripStopMerge";
import { normalizePdfPhotoCaption, PDF_PHOTO_CAPTION_MAX_LENGTH } from "@/lib/pdfPhotoCaption";
import { saveTripToCloud, deleteTripFromCloud } from "@/lib/cloudSync";
import { useAuth } from "@/components/AuthProvider";
import GoogleMap, { useGoogleAutocomplete, type MapHighlightPoi } from "@/components/GoogleMap";
import HotelDatePicker from "@/components/HotelDatePicker";
import { POI, searchPOIs, searchPOIsAlongRoute } from "@/lib/poiService";
import { Landmark, loadLandmarks, filterLandmarks, filterLandmarksAlongRoute, CATEGORIES, CONTINENTS } from "@/lib/landmarkService";
import { landmarkToMapPoi } from "@/lib/bucketMapPoi";
import {
  getApplicablePdfExportOptionDefs,
  isPdfExportOptionEnabled,
  type PdfExportPlanContext,
} from "@/lib/pdfExportOptions";
import WikiThumb from "@/components/WikiThumb";
import DateRangePicker from "@/components/DateRangePicker";
import BucketListMap from "@/components/BucketListMap";
import AirportSelect from "@/components/AirportSelect";
import { isCatalogModuleActive } from "@/lib/tripModuleCatalog";
import {
  assignStopRoles,
  applyRoundTripShortcut,
  endStopLooksLikeTripTitleOnly,
  isActiveRouteStopInsert,
  reorderStopsToInsertIndex,
  resolveRouteStopInsertIndex,
  ROUTE_TITLE_AS_DESTINATION_MESSAGE,
} from "@/lib/routeStops";
import {
  buildBookingHotelLink,
  buildExpediaHotelLink,
  buildHotelsComLink,
  buildAgodaHotelLink,
  buildTrivagoLink,
  buildHostelworldLink,
  buildGoogleFlightsLink,
  buildBookingFlightsLink,
  buildSkyscannerLink,
  buildKayakLink,
  buildBookingCarsLink,
  buildRentalcarsLink,
  buildBilligerMietwagenLink,
  buildAiraloLink,
  buildHolaflyLink,
  buildNomadEsimLink,
  buildGetYourGuideLink,
  buildViatorLink,
  buildTrainlineLink,
  buildOmioLink,
  buildAllianzTravelLink,
  buildWorldNomadsLink,
} from "@/lib/affiliateLinks";
import { trackAffiliateClick } from "@/lib/affiliateTracking";
import { partnerLabelFromUrl, partnerLinkCta } from "@/lib/partnerLabelFromUrl";
import { PartnerAffiliateMark } from "@/components/PartnerLinkBadge";
import { parseHotelBookingIcs } from "@/lib/parseHotelBookingIcs";
import TripLocalFileBar from "@/components/TripLocalFileBar";
import { tripLocalFileSession } from "@/lib/tripLocalFileAccess";
import {
  computeHotelStaysTimeline,
  getBookedHotelDatesOnly,
  isBookedHotelStop,
} from "@/lib/hotelStopDates";

function normalizePlaceKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

type CustomDiscoveryResult = {
  name: string;
  category: string;
  description: string;
  photoUrl?: string;
  lat?: number;
  lng?: number;
};

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string) || "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function imageUrlToPrintableDataUrl(url: string): Promise<string | undefined> {
  if (!url) return undefined;
  if (url.startsWith("data:image/")) return url;
  try {
    const proxied = await fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`);
    if (!proxied.ok) return undefined;
    const blob = await proxied.blob();
    const rawDataUrl = await blobToDataUrl(blob);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = reject;
      node.src = rawDataUrl;
    });
    const maxW = 1280;
    const scale = img.width > maxW ? maxW / img.width : 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return rawDataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.86);
  } catch {
    return undefined;
  }
}

async function fileToPrintableDataUrl(file: File): Promise<string | undefined> {
  try {
    const rawDataUrl = await blobToDataUrl(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = reject;
      node.src = rawDataUrl;
    });
    const maxW = 1400;
    const scale = img.width > maxW ? maxW / img.width : 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return rawDataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.88);
  } catch {
    return undefined;
  }
}

export default function PlanerPage() {
  const t = useTranslations("planer");
  const tt = useTranslations("planerTabs");
  const chrome = useTranslations("chrome");
  const { user } = useAuth();
  const { ready: autocompleteReady, attachAutocomplete } = useGoogleAutocomplete();
  const [trip, setTrip] = useState<Trip>(createNewTrip());
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    stops: number;
    legs: RouteLegInfo[];
  } | null>(null);
  const [savedTrips, setSavedTrips] = useState<Trip[]>([]);
  const [showTripList, setShowTripList] = useState(false);
  const planerRouter = useRouter();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [activeTab, setActiveTab] = useState<
    | "route"
    | "ortsinfo"
    | "hotels"
    | "flights"
    | "car"
    | "poi"
    | "report"
    | "bucket"
    | "esim"
    | "droneMaps"
    | "train"
    | "insurance"
  >("route");
  const [expandedEtappen, setExpandedEtappen] = useState<number[]>([]);
  const [hotelFocus, setHotelFocus] = useState<{ stopId: string; openBooking: boolean } | null>(null);
  const [hotelPanels, setHotelPanels] = useState<Record<string, "search" | "booking">>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [optimizeRoute, setOptimizeRoute] = useState(false);
  const [pois, setPois] = useState<POI[]>([]);
  const [poisLoading, setPoisLoading] = useState(false);
  const [poisSearchedFor, setPoisSearchedFor] = useState("");
  const [aiPois, setAiPois] = useState<AiPoiSuggestion[]>([]);
  const [aiPoisLoading, setAiPoisLoading] = useState(false);
  const [aiPoisError, setAiPoisError] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [landmarkQuery, setLandmarkQuery] = useState("");
  const [landmarkCategory, setLandmarkCategory] = useState("");
  const [landmarkContinent, setLandmarkContinent] = useState("");
  const [landmarkUnescoOnly, setLandmarkUnescoOnly] = useState(false);
  const [bucketDiscoveryScope, setBucketDiscoveryScope] = useState<"route" | "worldwide">("route");
  const [flightFrom, setFlightFrom] = useState("");
  const [flightTo, setFlightTo] = useState("");
  const [flightDepart, setFlightDepart] = useState("");
  const [flightReturn, setFlightReturn] = useState("");
  const [flightPassengers, setFlightPassengers] = useState(1);
  const [hotelOnlyDestination, setHotelOnlyDestination] = useState("");
  const [hotelOnlyCheckIn, setHotelOnlyCheckIn] = useState("");
  const [hotelOnlyCheckOut, setHotelOnlyCheckOut] = useState("");
  const [hotelOnlyTravelers, setHotelOnlyTravelers] = useState(2);
  const [hotelOnlyRooms, setHotelOnlyRooms] = useState(1);
  const hotelOnlyDestinationRef = useRef<HTMLInputElement>(null);
  const tripNameInputRef = useRef<HTMLInputElement>(null);
  const [landmarksLoaded, setLandmarksLoaded] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfProgressMsg, setPdfProgressMsg] = useState("");
  const [showPdfExportModal, setShowPdfExportModal] = useState(false);
  const [showModuleSettings, setShowModuleSettings] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [isEditingTripName, setIsEditingTripName] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const hotelStateBootstrappedRef = useRef(false);
  const [addingAiStops, setAddingAiStops] = useState<Record<string, boolean>>({});
  const [addedAiStops, setAddedAiStops] = useState<Record<string, boolean>>({});
  const [addingCustomStops, setAddingCustomStops] = useState<Record<string, boolean>>({});
  const [openEtappeMapIndex, setOpenEtappeMapIndex] = useState<number | null>(null);
  const etappeMapRef = useRef<HTMLDivElement>(null);
  const [showCoverPreviewModal, setShowCoverPreviewModal] = useState(false);
  const [showCoverVariantModal, setShowCoverVariantModal] = useState<"background" | "belowTitle" | null>(null);
  const [coverAspectRatio, setCoverAspectRatio] = useState<number | null>(null);
  const etappeMapMarkersRef = useRef<google.maps.Marker[]>([]);
  const etappeMapLineRef = useRef<google.maps.Polyline | null>(null);
  const etappeMapRouteRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [openCustomStopEtappe, setOpenCustomStopEtappe] = useState<number | null>(null);
  const [customStopQuery, setCustomStopQuery] = useState<Record<number, string>>({});
  const [customStopLoading, setCustomStopLoading] = useState<Record<number, boolean>>({});
  const [customStopResult, setCustomStopResult] = useState<Record<number, CustomDiscoveryResult | null>>({});
  const [openPhotoPickerEtappe, setOpenPhotoPickerEtappe] = useState<number | null>(null);
  const [photoTargetPagesByEtappe, setPhotoTargetPagesByEtappe] = useState<Record<number, number>>({});
  const [draggingPhotoSlotByEtappe, setDraggingPhotoSlotByEtappe] = useState<Record<number, number | null>>({});
  const [photoAspectByUrl, setPhotoAspectByUrl] = useState<Record<string, number>>({});
  const [quickStopDrafts, setQuickStopDrafts] = useState<Array<{ id: string; name: string; lat?: number; lng?: number }>>([]);
  const [draggingRouteStopId, setDraggingRouteStopId] = useState<string | null>(null);
  const [dropInsertIndex, setDropInsertIndex] = useState<number | null>(null);
  const [saveBlockedMessage, setSaveBlockedMessage] = useState<string | null>(null);
  const [pdfExportError, setPdfExportError] = useState<string | null>(null);
  const locale = useLocale();
  const icsFileInputRef = useRef<HTMLInputElement>(null);
  const icsImportStopIdRef = useRef<string | null>(null);
  const [icsImportFeedback, setIcsImportFeedback] = useState<Record<string, "ok" | "err">>({});

  useEffect(() => {
    setAiPois([]);
    setAiPoiPhotos({});
    setPois([]);
    setPoisSearchedFor("");
  }, [locale]);
  const [expandedStopBriefIds, setExpandedStopBriefIds] = useState<Record<string, boolean>>({});
  const [stopBriefLoadingId, setStopBriefLoadingId] = useState<string | null>(null);
  const [showBucketOnMap, setShowBucketOnMap] = useState(false);
  const [bucketGeocoded, setBucketGeocoded] = useState<Record<string, { lat: number; lng: number }>>({});

  const checkTabScroll = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkTabScroll();
    const delayed = setTimeout(checkTabScroll, 300);
    window.addEventListener("resize", checkTabScroll);
    return () => {
      clearTimeout(delayed);
      window.removeEventListener("resize", checkTabScroll);
    };
  }, [checkTabScroll]);

  useEffect(() => {
    if ((activeTab === "bucket" || showBucketOnMap) && !landmarksLoaded) {
      loadLandmarks().then((data) => {
        setLandmarks(data);
        setLandmarksLoaded(true);
      });
    }
  }, [activeTab, showBucketOnMap, landmarksLoaded]);

  const prevActiveTabRef = useRef(activeTab);
  useEffect(() => {
    if (activeTab === "bucket" && prevActiveTabRef.current !== "bucket" && !landmarkQuery.trim()) {
      setBucketDiscoveryScope("route");
    }
    prevActiveTabRef.current = activeTab;
  }, [activeTab, landmarkQuery]);

  useEffect(() => {
    if (activeTab === "flights") {
      if (!flightFrom && origin) setFlightFrom(origin);
      if (!flightTo && destination) setFlightTo(destination);
      if (!flightDepart && trip.startDate) setFlightDepart(trip.startDate);
      if (!flightReturn && trip.endDate) setFlightReturn(trip.endDate);
      if (flightPassengers === 1 && trip.travelers > 1) setFlightPassengers(trip.travelers);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "hotels" || !autocompleteReady || !hotelOnlyDestinationRef.current) return;
    attachAutocomplete(hotelOnlyDestinationRef.current, (place) => {
      setHotelOnlyDestination(place);
    });
  }, [activeTab, autocompleteReady, attachAutocomplete]);

  useEffect(() => {
    if (hotelStateBootstrappedRef.current) return;
    hotelStateBootstrappedRef.current = true;
    if (typeof window === "undefined") return;
    const urlParams = new URL(window.location.href).searchParams;
    const qDestination = urlParams.get("hdest") || "";
    const qCheckIn = urlParams.get("hci") || "";
    const qCheckOut = urlParams.get("hco") || "";
    const qAdults = Number(urlParams.get("hadults") || "");
    const qRooms = Number(urlParams.get("hrooms") || "");
    if (qDestination) setHotelOnlyDestination(qDestination);
    if (qCheckIn) setHotelOnlyCheckIn(qCheckIn);
    if (qCheckOut) setHotelOnlyCheckOut(qCheckOut);
    if (Number.isFinite(qAdults) && qAdults > 0) setHotelOnlyTravelers(qAdults);
    if (Number.isFinite(qRooms) && qRooms > 0) setHotelOnlyRooms(qRooms);
  }, []);

  useEffect(() => {
    // Keep hotel-only search clean when switching trips.
    setHotelOnlyDestination("");
    setHotelOnlyCheckIn("");
    setHotelOnlyCheckOut("");
    setHotelOnlyTravelers(Math.max(1, trip.travelers || 2));
    setHotelOnlyRooms(1);
  }, [trip.id, trip.travelers]);

  useEffect(() => {
    const isDefaultName = !trip.name?.trim() || trip.name === "Neue Reise";
    setIsEditingTripName(isDefaultName);
  }, [trip.id]);

  useEffect(() => {
    if (!isEditingTripName) return;
    const timer = setTimeout(() => {
      tripNameInputRef.current?.focus();
    }, 250);
    return () => clearTimeout(timer);
  }, [trip.id, isEditingTripName]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const setOrDelete = (key: string, value?: string) => {
      const v = (value || "").trim();
      if (v) url.searchParams.set(key, v);
      else url.searchParams.delete(key);
    };
    setOrDelete("hdest", hotelOnlyDestination);
    setOrDelete("hci", hotelOnlyCheckIn);
    setOrDelete("hco", hotelOnlyCheckOut);
    setOrDelete("hadults", String(Math.max(1, hotelOnlyTravelers || 1)));
    setOrDelete("hrooms", String(Math.max(1, hotelOnlyRooms || 1)));
    window.history.replaceState({}, "", url.toString());
  }, [hotelOnlyDestination, hotelOnlyCheckIn, hotelOnlyCheckOut, hotelOnlyTravelers, hotelOnlyRooms]);

  // Load active trip or redirect to welcome
  useEffect(() => {
    const activeId = getActiveTripId();
    if (activeId) {
      const existing = loadTripHydrated(activeId);
      if (existing) {
        setTrip(existing);
      } else {
        planerRouter.replace("/");
      }
    } else {
      planerRouter.replace("/");
    }
    setSavedTrips(getAllTrips());
  }, [planerRouter]);

  const hasUnsavedChangesRef = useRef(false);
  hasUnsavedChangesRef.current = hasUnsavedChanges;

  useEffect(() => {
    const reloadFromStorage = () => {
      const activeId = getActiveTripId();
      if (!activeId) return;
      const fresh = loadTripHydrated(activeId);
      if (fresh) {
        setTrip((prev) => {
          if (prev.id !== fresh.id) return fresh;
          // Offene Edits nicht durch Cloud-/Storage-Merge überschreiben.
          const preferLocalEdits = hasUnsavedChangesRef.current;
          let merged = preferLocalEdits
            ? mergeTripRecords(prev, fresh)
            : mergeTripRecords(fresh, prev);
          const cover =
            prev.pdfCoverPhotoDataUrl?.trim() ||
            merged.pdfCoverPhotoDataUrl?.trim() ||
            readTripCoverPhoto(fresh.id);
          if (cover && !merged.pdfCoverPhotoDataUrl?.trim()) {
            merged = { ...merged, pdfCoverPhotoDataUrl: cover };
          }
          queueMicrotask(() => {
            saveTrip(merged);
            setSavedTrips(getAllTrips());
          });
          return preserveStopPhotos(prev, merged);
        });
      }
      setSavedTrips(getAllTrips());
    };
    window.addEventListener(TRIPS_MERGED_EVENT, reloadFromStorage);
    return () => window.removeEventListener(TRIPS_MERGED_EVENT, reloadFromStorage);
  }, []);

  // Ortsfotos aus IndexedDB restaurieren, falls der localStorage-Sidecar
  // (Quota) sie verloren hat – sonst zeigt die Ortsinfo „Kein Bild".
  useEffect(() => {
    if (!trip.id) return;
    let cancelled = false;
    void loadDurableStopMedia(trip.id).then((media) => {
      if (cancelled || !Object.keys(media).length) return;
      setTrip((prev) => {
        if (prev.id !== trip.id) return prev;
        let changed = false;
        const stops = prev.stops.map((s) => {
          const photo = media[s.id]?.trim();
          if (photo && photo !== s.discoveryPhotoDataUrl) {
            changed = true;
            return { ...s, discoveryPhotoDataUrl: photo };
          }
          return s;
        });
        if (!changed) return prev;
        const next = syncTripRouteStops({ ...prev, stops });
        queueMicrotask(() => saveTrip(next));
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [trip.id]);

  useEffect(() => {
    if (!trip.id) return;
    let cancelled = false;
    void loadDurablePdfMedia(trip.id).then((side) => {
      if (cancelled || !side) return;
      setTrip((prev) => {
        if (prev.id !== trip.id) return prev;
        const next = applyPdfMediaToTrip(prev, side);
        const coverChanged =
          !!next.pdfCoverPhotoDataUrl?.trim() && !prev.pdfCoverPhotoDataUrl?.trim();
        const prevPhotos = Object.values(prev.pdfPhotosByEtappe || {}).flat().length;
        const nextPhotos = Object.values(next.pdfPhotosByEtappe || {}).flat().length;
        const prevLib = Object.values(prev.pdfPhotoLibraryByEtappe || {}).flat().length;
        const nextLib = Object.values(next.pdfPhotoLibraryByEtappe || {}).flat().length;
        if (!coverChanged && nextPhotos === prevPhotos && nextLib === prevLib) return prev;
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [trip.id]);

  // Legacy Data-URLs → st:-Assets (Thumbs in IDB); Trip bleibt schlank
  useEffect(() => {
    if (!trip.id) return;
    const hasData =
      Object.values(trip.pdfPhotosByEtappe || {}).flat().some((u) => u.startsWith("data:")) ||
      Object.values(trip.pdfPhotoLibraryByEtappe || {}).flat().some((u) => u.startsWith("data:")) ||
      !!trip.pdfCoverPhotoDataUrl?.startsWith("data:");
    if (!hasData) return;
    let cancelled = false;
    const tripId = trip.id;
    void import("@/lib/tripLocalFileDocument").then(({ migrateInlineDataUrlsToAssets }) =>
      migrateInlineDataUrlsToAssets(trip).then((migrated) => {
        if (cancelled) return;
        // Wichtig: nur Medien-Refs übernehmen – nie den ganzen Trip ersetzen.
        // Sonst überschreibt eine langsame Migration frische Stopps (z. B. Bari).
        setTrip((prev) => {
          if (prev.id !== tripId || prev.id !== migrated.id) return prev;
          const photoById = new Map((migrated.stops || []).map((s) => [s.id, s]));
          const next: Trip = {
            ...prev,
            pdfPhotosByEtappe: migrated.pdfPhotosByEtappe,
            pdfPhotoLibraryByEtappe: migrated.pdfPhotoLibraryByEtappe,
            pdfCoverPhotoDataUrl: migrated.pdfCoverPhotoDataUrl,
            pdfExtraTextByEtappe: migrated.pdfExtraTextByEtappe ?? prev.pdfExtraTextByEtappe,
            stops: (prev.stops || []).map((s) => {
              const m = photoById.get(s.id);
              if (!m) return s;
              return {
                ...s,
                discoveryPhotoDataUrl: m.discoveryPhotoDataUrl ?? s.discoveryPhotoDataUrl,
                discoveryPhotoUrl: m.discoveryPhotoUrl ?? s.discoveryPhotoUrl,
              };
            }),
          };
          queueMicrotask(() => {
            saveTrip(next);
            setSavedTrips(getAllTrips());
          });
          return next;
        });
      })
    );
    return () => {
      cancelled = true;
    };
    // Nur bei Trip-Wechsel / wenn noch Data-URLs da sind
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.id, trip.pdfCoverPhotoDataUrl, trip.pdfPhotosByEtappe, trip.pdfPhotoLibraryByEtappe]);

  /** Stopps, deren Foto der Nutzer bewusst gelöscht hat („Ortsinfo entfernen"). */
  const photoClearAllowRef = useRef<Set<string>>(new Set());
  /** Immer aktueller Trip – Speichern/Datei darf keinen React-Stale-Stand schreiben. */
  const tripLatestRef = useRef(trip);
  tripLatestRef.current = trip;

  const updateTrip = useCallback((updates: Partial<Trip> | ((prev: Trip) => Trip)) => {
    setTrip((prev) => {
      const base = typeof updates === "function" ? updates(prev) : { ...prev, ...updates };
      // Harte Garantie: Kein Update darf ein vorhandenes Stopp-Foto entfernen.
      const next = prev.id === base.id ? preserveStopPhotos(prev, base, photoClearAllowRef.current) : base;
      tripLatestRef.current = next;
      return next;
    });
    setHasUnsavedChanges(true);
  }, []);

  const updateTripSilent = useCallback((updates: Partial<Trip> | ((prev: Trip) => Trip)) => {
    setTrip((prev) => {
      const base = typeof updates === "function" ? updates(prev) : { ...prev, ...updates };
      const next = prev.id === base.id ? preserveStopPhotos(prev, base, photoClearAllowRef.current) : base;
      tripLatestRef.current = next;
      return next;
    });
  }, []);

  const persistTripSnapshot = useCallback((snapshot: Trip) => {
    const synced = syncTripRouteStops(snapshot);
    tripLatestRef.current = synced;
    saveTrip(synced);
    setSavedTrips(getAllTrips());
  }, []);

  const handleSave = useCallback(() => {
    // Titel=Ziel ohne Koordinaten: nur PDF blockieren, Browser-/Cloud-Save immer erlauben
    const snapshot = tripLatestRef.current;
    setSaveBlockedMessage(null);
    saveTrip(snapshot);
    setActiveTripId(snapshot.id);
    setSavedTrips(getAllTrips());
    setHasUnsavedChanges(false);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
    if (user) {
      saveTripToCloud(snapshot, user.id);
    }
    void tripLocalFileSession.flushWrite(snapshot);
  }, [user]);

  const persistBrowserCopyForFile = useCallback(() => {
    const snapshot = tripLatestRef.current;
    saveTrip(snapshot);
    setActiveTripId(snapshot.id);
    setSavedTrips(getAllTrips());
  }, []);

  const handleTripFileImported = useCallback((imported: Trip) => {
    saveTrip(imported);
    setTrip(imported);
    setActiveTripId(imported.id);
    setSavedTrips(getAllTrips());
    setHasUnsavedChanges(false);
  }, []);

  // Auto-save after 3 seconds of inactivity
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const timer = setTimeout(() => {
      handleSave();
    }, 1200);
    return () => clearTimeout(timer);
  }, [trip, hasUnsavedChanges, handleSave]);

  // Safety net: persist pending edits when tab/app is closed or backgrounded.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const flushPendingTrip = () => {
      if (!hasUnsavedChanges) return;
      const snapshot = { ...trip, updatedAt: new Date().toISOString() };
      saveTrip(snapshot);
      setActiveTripId(trip.id);
      void tripLocalFileSession.flushWrite(snapshot);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        flushPendingTrip();
      }
    };

    window.addEventListener("pagehide", flushPendingTrip);
    window.addEventListener("beforeunload", flushPendingTrip);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("pagehide", flushPendingTrip);
      window.removeEventListener("beforeunload", flushPendingTrip);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [trip, hasUnsavedChanges]);

  const handleNewTrip = () => {
    if (hasUnsavedChanges) {
      handleSave();
    }
    planerRouter.push("/");
  };

  const handleLoadTrip = (id: string) => {
    const loaded = loadTripHydrated(id);
    if (loaded) {
      setTrip(loaded);
      setActiveTripId(id);
      setHasUnsavedChanges(false);
      setShowTripList(false);
    }
  };

  const handleDeleteTrip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTrip(id);
    if (user) {
      deleteTripFromCloud(id);
    }
    setSavedTrips(getAllTrips());
    if (trip.id === id) {
      const newTrip = createNewTrip();
      setTrip(newTrip);
      setActiveTripId(newTrip.id);
    }
  };

  const TRANSPORT_TABS: string[] = ["route", "car", "train", "flights"];
  const isTransportTab = TRANSPORT_TABS.includes(activeTab);

  const defaultStopsForRoute = (): RouteStop[] => [
    { id: "start", name: "", type: "start" },
    { id: "end", name: "", type: "end" },
  ];

  const currentRouteStops: RouteStop[] = (() => {
    if (activeTab === "route") return trip.stops;
    const key = activeTab as TransportModule;
    if (TRANSPORT_TABS.includes(key)) return trip.routes?.[key]?.stops || defaultStopsForRoute();
    return trip.stops;
  })();

  const currentRouteViaPoints: ViaPoint[] = (() => {
    if (activeTab === "route") return trip.routes?.route?.viaPoints || [];
    const key = activeTab as TransportModule;
    if (TRANSPORT_TABS.includes(key)) return trip.routes?.[key]?.viaPoints || [];
    return trip.routes?.route?.viaPoints || [];
  })();

  const updateCurrentStops = useCallback(
    (newStops: RouteStop[] | ((prev: RouteStop[]) => RouteStop[])) => {
      const resolve = (cur: RouteStop[]): RouteStop[] =>
        typeof newStops === "function"
          ? (newStops as (prev: RouteStop[]) => RouteStop[])(cur)
          : newStops;
      updateTrip((prev) => {
        let next: Trip;
        if (activeTab === "route" || !TRANSPORT_TABS.includes(activeTab)) {
          // Non-transport tabs (e.g. POI/Hotels/Bucket) still edit the main route stops.
          next = syncTripRouteStops({
            ...prev,
            stops: resolve(prev.stops),
            updatedAt: new Date().toISOString(),
          });
        } else {
          const key = activeTab as TransportModule;
          const cur = prev.routes?.[key]?.stops || defaultStopsForRoute();
          next = {
            ...prev,
            updatedAt: new Date().toISOString(),
            routes: {
              ...prev.routes,
              [key]: { ...prev.routes?.[key], stops: resolve(cur) },
            },
          };
        }
        // Sofort persistieren – nicht erst auf den Autosave-Timer warten.
        queueMicrotask(() => persistTripSnapshot(next));
        return next;
      });
    },
    [activeTab, updateTrip, persistTripSnapshot]
  );

  const updateCurrentViaPoints = useCallback((newViaPoints: ViaPoint[]) => {
    const toKey = (vp: ViaPoint) => `${vp.afterStopId || ""}:${vp.lat.toFixed(5)}:${vp.lng.toFixed(5)}`;
    const normalize = (arr: ViaPoint[]) =>
      arr
        .filter((vp) => Number.isFinite(vp.lat) && Number.isFinite(vp.lng))
        .map((vp, idx) => ({
          id: vp.id || `via-${Date.now()}-${idx}`,
          lat: vp.lat,
          lng: vp.lng,
          afterStopId: vp.afterStopId,
        }))
        .sort((a, b) => toKey(a).localeCompare(toKey(b)));

    const normalized = normalize(newViaPoints);
    const current = normalize(currentRouteViaPoints);
    const same =
      normalized.length === current.length &&
      normalized.every((vp, i) => toKey(vp) === toKey(current[i]));
    if (same) return;

    if (activeTab === "route") {
      updateTrip((prev) => ({
        ...prev,
        routes: {
          ...(prev.routes || {}),
          route: {
            stops: prev.routes?.route?.stops || prev.stops,
            viaPoints: normalized,
          },
        },
      }));
      return;
    }

    const key = activeTab as TransportModule;
    if (!TRANSPORT_TABS.includes(key)) return;
    updateTrip((prev) => ({
      ...prev,
      routes: {
        ...(prev.routes || {}),
        [key]: {
          stops: prev.routes?.[key]?.stops || defaultStopsForRoute(),
          viaPoints: normalized,
        },
      },
    }));
  }, [activeTab, currentRouteViaPoints, updateTrip]);

  const addStop = () => {
    const newStop: RouteStop = {
      id: `stop-${Date.now()}`,
      name: "",
      type: "stop",
    };
    const endIdx = currentRouteStops.findIndex((s) => s.type === "end");
    const newStops = [...currentRouteStops];
    newStops.splice(endIdx, 0, newStop);
    updateCurrentStops(newStops);
  };

  const addQuickStopDraft = () => {
    setQuickStopDrafts((prev) => [...prev, { id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: "" }]);
  };

  const commitQuickStopDraft = async (draftId: string, payload?: { name: string; lat?: number; lng?: number }) => {
    const draft = payload || quickStopDrafts.find((d) => d.id === draftId);
    if (!draft?.name.trim()) return;
    const inserted = await addStopSmart(draft.name.trim(), draft.lat, draft.lng);
    if (inserted) {
      setQuickStopDrafts((prev) => prev.filter((d) => d.id !== draftId));
    }
  };

  const addStopFromMap = (
    placeName: string,
    lat: number,
    lng: number,
    insertAtIndex?: number,
    photoUrl?: string
  ) => {
    updateTrip((prev) => {
      const routeStops =
        activeTab === "route"
          ? prev.stops
          : TRANSPORT_TABS.includes(activeTab)
            ? prev.routes?.[activeTab as TransportModule]?.stops || defaultStopsForRoute()
            : prev.stops;

      const baseName = (placeName || "Ort").trim();
      const baseKey = normalizePlaceKey(baseName);
      const hasSameName = routeStops.some((s) => normalizePlaceKey(s.name) === baseKey);
      const finalName = hasSameName ? `${baseName} (POI)` : baseName;
      const effectiveInsertIdx =
        insertAtIndex != null && Number.isFinite(insertAtIndex)
          ? Math.max(0, Math.min(routeStops.length, insertAtIndex))
          : (() => {
              const endIdx = routeStops.findIndex((s) => s.type === "end");
              return endIdx >= 0 ? endIdx : routeStops.length;
            })();
      const discoveryEtappeIndex = Math.max(
        0,
        routeStops
          .slice(0, effectiveInsertIdx)
          .filter((s) => s.type === "stop" && !!s.isHotel).length
      );
      const newStop: RouteStop = {
        id: `stop-${Date.now()}`,
        name: finalName,
        type: "stop",
        lat,
        lng,
        discoverySource: "google",
        discoveryCategory: "Karten-POI",
        discoveryEtappeIndex,
        discoveryAddedAt: new Date().toISOString(),
        discoveryPhotoUrl: photoUrl,
      };
      const newStops = [...routeStops];
      if (insertAtIndex != null && insertAtIndex >= 0 && insertAtIndex <= newStops.length) {
        newStops.splice(insertAtIndex, 0, newStop);
      } else {
        const endIdx = newStops.findIndex((s) => s.type === "end");
        newStops.splice(endIdx >= 0 ? endIdx : newStops.length, 0, newStop);
      }

      const now = new Date().toISOString();
      let next: Trip;
      if (activeTab === "route") {
        next = syncTripRouteStops({ ...prev, stops: newStops, updatedAt: now });
      } else if (TRANSPORT_TABS.includes(activeTab)) {
        const key = activeTab as TransportModule;
        next = {
          ...prev,
          updatedAt: now,
          routes: {
            ...prev.routes,
            [key]: { ...prev.routes?.[key], stops: newStops },
          },
        };
      } else {
        next = syncTripRouteStops({ ...prev, stops: newStops, updatedAt: now });
      }
      queueMicrotask(() => persistTripSnapshot(next));
      return next;
    });
  };

  const addStopSmart = async (
    name: string,
    lat?: number,
    lng?: number,
    extraFields?: Partial<RouteStop>
  ): Promise<boolean> => {
    const wantedKey = normalizePlaceKey(name);
    if (currentRouteStops.some((s) => normalizePlaceKey(s.name) === wantedKey)) {
      return false;
    }
    const newStop: RouteStop = { id: `stop-${Date.now()}`, name, type: "stop", lat, lng, ...extraFields };
    const stops = currentRouteStops;
    const existingStops = stops.filter((s) => s.name.trim());
    if (existingStops.length < 2 || lat == null || lng == null) {
      updateCurrentStops((prevStops) => {
        if (prevStops.some((s) => normalizePlaceKey(s.name) === wantedKey)) return prevStops;
        const next = [...prevStops];
        const endIdx = next.findIndex((s) => s.type === "end");
        next.splice(endIdx >= 0 ? endIdx : next.length, 0, newStop);
        return next;
      });
      return true;
    }
    // Geocoding darf dauern – danach in den AKTUELLEN Stand einfügen,
    // nicht in die (inzwischen evtl. veraltete) Liste von vor dem Await.
    const coords = await Promise.all(
      stops.map(async (s) => {
        const c = await geocodeStop(s);
        return c ? { ...s, lat: c.lat, lng: c.lng } : s;
      })
    );
    const coordById: Record<string, RouteStop> = {};
    for (const c of coords) coordById[c.id] = c;
    updateCurrentStops((prevStops) => {
      if (prevStops.some((s) => normalizePlaceKey(s.name) === wantedKey)) return prevStops;
      const filled: RouteStop[] = prevStops.map((s) => {
        const c = coordById[s.id];
        return c && c.lat != null && s.lat == null ? { ...s, lat: c.lat, lng: c.lng } : s;
      });
      let bestIdx = filled.findIndex((s) => s.type === "end");
      let minDetour = Infinity;
      for (let i = 0; i < filled.length - 1; i++) {
        const a = filled[i], b = filled[i + 1];
        if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) continue;
        const ab = haversine(a.lat, a.lng, b.lat, b.lng);
        const ac = haversine(a.lat, a.lng, lat!, lng!);
        const cb = haversine(lat!, lng!, b.lat, b.lng);
        const detour = ac + cb - ab;
        if (detour < minDetour) { minDetour = detour; bestIdx = i + 1; }
      }
      const next = [...filled];
      next.splice(bestIdx >= 0 ? bestIdx : next.length, 0, newStop);
      return next;
    });
    return true;
  };

  const removeStop = (id: string) => {
    markStopsDeleted(trip.id, [id]);
    updateCurrentStops((prevStops) => prevStops.filter((s) => s.id !== id));
  };

  const updateStop = (id: string, name: string) => {
    if (activeTab === "route") {
      updateTrip((prev) => ({
        ...prev,
        stops: prev.stops.map((s) => (s.id === id ? { ...s, name } : s)),
      }));
      return;
    }

    const key = activeTab as TransportModule;
    if (TRANSPORT_TABS.includes(key)) {
      updateTrip((prev) => {
        const currentStops = prev.routes?.[key]?.stops || defaultStopsForRoute();
        return {
          ...prev,
          routes: {
            ...prev.routes,
            [key]: {
              stops: currentStops.map((s) => (s.id === id ? { ...s, name } : s)),
            },
          },
        };
      });
    }
  };

  const geocodeStop = async (s: RouteStop): Promise<{ lat: number; lng: number } | null> => {
    if (s.lat != null && s.lng != null) return { lat: s.lat, lng: s.lng };
    if (!s.name.trim() || !window.google?.maps) return null;
    try {
      const geocoder = new google.maps.Geocoder();
      const res = await geocoder.geocode({ address: s.bookingAddress || s.name });
      const loc = res.results?.[0]?.geometry?.location;
      if (loc) return { lat: loc.lat(), lng: loc.lng() };
    } catch { /* ignore */ }
    return null;
  };

  const updateStopWithCoords = async (id: string, name: string, lat: number, lng: number) => {
    const stops = currentRouteStops;
    const stopIdx = stops.findIndex((s) => s.id === id);
    if (stopIdx < 0) return;
    const stop = stops[stopIdx];
    if (stop.type !== "stop") {
      updateCurrentStops((prevStops) => prevStops.map((s) => (s.id === id ? { ...s, name, lat, lng } : s)));
      return;
    }

    const newStops = stops.filter((s) => s.id !== id);
    const updatedStop: RouteStop = { ...stop, name, lat, lng };

    const filledStops = newStops.filter((s) => s.name.trim());
    if (filledStops.length < 2) {
      updateCurrentStops((prevStops) => {
        const cur = prevStops.find((s) => s.id === id);
        const without = prevStops.filter((s) => s.id !== id);
        const endIdx = without.findIndex((s) => s.type === "end");
        const next = [...without];
        next.splice(endIdx >= 0 ? endIdx : next.length, 0, { ...(cur || updatedStop), name, lat, lng });
        return next;
      });
      return;
    }

    const coords = await Promise.all(
      newStops.map(async (s) => {
        const c = await geocodeStop(s);
        if (c) s = { ...s, lat: c.lat, lng: c.lng };
        return s;
      })
    );

    let bestIdx = coords.findIndex((s) => s.type === "end");
    let minDetour = Infinity;

    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i];
      const b = coords[i + 1];
      if (!a.name.trim() || !b.name.trim()) continue;
      const aLat = a.lat, aLng = a.lng;
      const bLat = b.lat, bLng = b.lng;
      if (aLat == null || aLng == null || bLat == null || bLng == null) continue;

      const ab = haversine(aLat, aLng, bLat, bLng);
      const ac = haversine(aLat, aLng, lat, lng);
      const cb = haversine(lat, lng, bLat, bLng);
      const detour = ac + cb - ab;

      if (detour < minDetour) {
        minDetour = detour;
        bestIdx = i + 1;
      }
    }

    void bestIdx;
    void minDetour;
    // Nach dem Geocoding in den AKTUELLEN Stand einfügen (nicht in die alte Liste).
    const coordById: Record<string, RouteStop> = {};
    for (const c of coords) coordById[c.id] = c;
    updateCurrentStops((prevStops) => {
      const current = prevStops.find((s) => s.id === id);
      const upd: RouteStop = { ...(current || stop), name, lat, lng };
      const without = prevStops.filter((s) => s.id !== id);
      const filled: RouteStop[] = without.map((s) => {
        const c = coordById[s.id];
        return c && c.lat != null && s.lat == null ? { ...s, lat: c.lat, lng: c.lng } : s;
      });
      let insertIdx = filled.findIndex((s) => s.type === "end");
      let best = Infinity;
      for (let i = 0; i < filled.length - 1; i++) {
        const a = filled[i];
        const b = filled[i + 1];
        if (!a.name.trim() || !b.name.trim()) continue;
        if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) continue;
        const detour =
          haversine(a.lat, a.lng, lat, lng) + haversine(lat, lng, b.lat, b.lng) - haversine(a.lat, a.lng, b.lat, b.lng);
        if (detour < best) {
          best = detour;
          insertIdx = i + 1;
        }
      }
      const next = [...filled];
      next.splice(insertIdx >= 0 ? insertIdx : next.length, 0, upd);
      return next;
    });
  };

  const openIcsBookingImport = (stopId: string) => {
    icsImportStopIdRef.current = stopId;
    icsFileInputRef.current?.click();
  };

  const handleIcsBookingFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const stopId = icsImportStopIdRef.current;
    icsImportStopIdRef.current = null;
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !stopId) return;

    try {
      const text = await file.text();
      const parsed = parseHotelBookingIcs(text);
      const patch: Partial<RouteStop> = { isHotel: true };
      if (parsed.hotelName) patch.bookingHotelName = parsed.hotelName;
      if (parsed.address) patch.bookingAddress = parsed.address;
      if (parsed.confirmation) patch.bookingConfirmation = parsed.confirmation;
      if (parsed.bookingLink) patch.bookingLink = parsed.bookingLink;
      if (parsed.provider) patch.bookingProvider = parsed.provider;
      if (parsed.checkIn) patch.hotelCheckIn = parsed.checkIn;
      if (parsed.nights) patch.hotelNights = parsed.nights;
      updateStopField(stopId, patch);
      setHotelPanels((prev) => ({ ...prev, [stopId]: "booking" }));
      setIcsImportFeedback((prev) => ({ ...prev, [stopId]: "ok" }));
      window.setTimeout(() => {
        setIcsImportFeedback((prev) => {
          const next = { ...prev };
          delete next[stopId];
          return next;
        });
      }, 5000);
    } catch {
      setIcsImportFeedback((prev) => ({ ...prev, [stopId]: "err" }));
    }
  };

  const updateStopField = (id: string, fields: Partial<RouteStop>) => {
    if (activeTab === "route" || activeTab === "ortsinfo") {
      updateTrip((prev) => {
        const next = syncTripRouteStops({
          ...prev,
          stops: prev.stops.map((s) => (s.id === id ? { ...s, ...fields } : s)),
          updatedAt: new Date().toISOString(),
        });
        // Sidecar hier nur SCHREIBEN, nie löschen: Ein `undefined` im Patch
        // (z. B. von der Ortsinfo) darf ein gespeichertes Foto nicht killen.
        // Explizites Löschen läuft über clearStopBrief → removeStopPhotoFromSidecar.
        const dataUrl = fields.discoveryPhotoDataUrl?.trim();
        if (dataUrl) {
          writeStopPhotoToSidecar(prev.id, id, dataUrl);
          queueMicrotask(() => persistTripSnapshot(next));
        }
        return next;
      });
      return;
    }

    const key = activeTab as TransportModule;
    if (TRANSPORT_TABS.includes(key)) {
      updateTrip((prev) => {
        const currentStops = prev.routes?.[key]?.stops || defaultStopsForRoute();
        return {
          ...prev,
          routes: {
            ...prev.routes,
            [key]: {
              stops: currentStops.map((s) => (s.id === id ? { ...s, ...fields } : s)),
            },
          },
        };
      });
      return;
    }

    updateTrip((prev) => ({
      ...prev,
      stops: prev.stops.map((s) => (s.id === id ? { ...s, ...fields } : s)),
    }));
  };

  const printablePhotoForStop = useCallback(
    async (stop: RouteStop, photoUrl?: string) => {
      if (!photoUrl || !stopBriefIncluded(stop)) return undefined;
      return await imageUrlToPrintableDataUrl(photoUrl);
    },
    [],
  );

  const setStopBriefPdfIncluded = useCallback(
    async (stopId: string, included: boolean) => {
      const stop = trip.stops.find((s) => s.id === stopId);
      if (!stop) return;
      if (!included) {
        // Nur aus dem PDF nehmen – das (eigene) Bild bleibt erhalten.
        updateTrip((prev) => {
          const next = syncTripRouteStops({
            ...prev,
            stops: prev.stops.map((s) =>
              s.id === stopId ? { ...s, discoveryIncludeInReport: false } : s,
            ),
          });
          saveTrip(next);
          return next;
        });
        setHasUnsavedChanges(false);
        return;
      }
      const existingData = stop.discoveryPhotoDataUrl?.trim();
      const photoUrl = stop.discoveryPhotoUrl;
      const photoDataUrl =
        existingData ||
        (photoUrl ? await imageUrlToPrintableDataUrl(photoUrl) : undefined);
      updateTrip((prev) => {
        const next = syncTripRouteStops({
          ...prev,
          stops: prev.stops.map((s) =>
            s.id === stopId
              ? {
                  ...s,
                  discoveryIncludeInReport: true,
                  ...(photoDataUrl ? { discoveryPhotoDataUrl: photoDataUrl } : {}),
                }
              : s,
          ),
        });
        saveTrip(next);
        return next;
      });
      setHasUnsavedChanges(false);
    },
    [trip.stops, updateTrip],
  );

  const setPdfPhotoCaptionForEtappe = useCallback(
    (etappeIndex: number, photoUrl: string, caption: string) => {
      const key = String(etappeIndex);
      const normalized = normalizePdfPhotoCaption(caption);
      updateTrip((prev) => {
        const perEtappe = { ...(prev.pdfPhotoCaptionsByEtappe?.[key] || {}) };
        if (normalized) perEtappe[photoUrl] = normalized;
        else delete perEtappe[photoUrl];
        const next = syncTripRouteStops({
          ...prev,
          pdfPhotoCaptionsByEtappe: {
            ...(prev.pdfPhotoCaptionsByEtappe || {}),
            [key]: perEtappe,
          },
        });
        saveTrip(next);
        return next;
      });
      setHasUnsavedChanges(false);
    },
    [updateTrip],
  );

  const enrichStopBrief = useCallback(
    async (stopId: string, opts?: { force?: boolean }) => {
      const stop = currentRouteStops.find((s) => s.id === stopId);
      if (!stop?.name?.trim()) return;
      if (!stopBriefIncluded(stop) && !opts?.force) return;
      if (!opts?.force && stopHasBriefContent(stop)) return;

      setStopBriefLoadingId(stopId);
      try {
        let lat = stop.lat;
        let lng = stop.lng;
        if (lat == null || lng == null) {
          const geo = await geocodeStop(stop);
          if (geo) {
            lat = geo.lat;
            lng = geo.lng;
            updateStopField(stopId, { lat, lng });
          }
        }
        const resp = await fetch("/api/stop-brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: stop.name,
            lat,
            lng,
            language: asAppLocale(locale),
          }),
        });
        const data = await resp.json();
        if (!resp.ok) return;

        const nextPhotoUrl = (data.photoUrl as string) || stop.discoveryPhotoUrl;
        const fetchedDataUrl = await printablePhotoForStop(stop, nextPhotoUrl);
        const keepCustomPhoto = isUserUploadedStopPhoto(stop);

        const preserveSource =
          stop.discoverySource &&
          stop.discoverySource !== "autocomplete" &&
          stop.discoverySource !== "manual";

        const briefPatch: Partial<RouteStop> = {
          discoveryDescription: (data.description as string) || stop.discoveryDescription,
          discoveryWikipediaTitle: data.wikipediaTitle,
          discoveryLanguage: asAppLocale(locale),
          discoveryBriefSource: (data.briefSource as RouteStop["discoveryBriefSource"]) || "ai",
          discoveryBriefQualityHint: undefined,
          discoveryAddedAt: new Date().toISOString(),
          ...(!preserveSource ? { discoverySource: "autocomplete" as const } : {}),
        };
        if (!keepCustomPhoto) {
          briefPatch.discoveryPhotoUrl = nextPhotoUrl;
          if (fetchedDataUrl) {
            briefPatch.discoveryPhotoDataUrl = fetchedDataUrl;
          }
          // Kein speicherbares Bild geladen → altes Bild unverändert lassen.
        }
        // Eigenes Bild: Foto-Felder beim Text-Laden grundsätzlich nicht anfassen.

        updateStopField(stopId, briefPatch);
        setExpandedStopBriefIds((prev) => ({ ...prev, [stopId]: true }));
      } finally {
        setStopBriefLoadingId(null);
      }
    },
    [currentRouteStops, geocodeStop, locale, printablePhotoForStop, updateStopField],
  );

  const refreshStopBriefPhoto = useCallback(
    async (stopId: string, photoMode: "reload" | "alternate") => {
      const stop = currentRouteStops.find((s) => s.id === stopId);
      if (!stop?.name?.trim()) return;
      setStopBriefLoadingId(stopId);
      try {
        const resp = await fetch("/api/stop-brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: stop.name,
            wikipediaTitle: stop.discoveryWikipediaTitle,
            lat: stop.lat,
            lng: stop.lng,
            language: asAppLocale(locale),
            photoMode,
            variantIndex: stop.discoveryPhotoVariantIndex,
            currentPhotoUrl: stop.discoveryPhotoUrl,
          }),
        });
        const data = await resp.json();
        if (!resp.ok) return;
        const fetchedDataUrl = await printablePhotoForStop(stop, data.photoUrl as string);
        const keepCustomPhoto = isUserUploadedStopPhoto(stop);
        const photoPatch: Partial<RouteStop> = {
          discoveryPhotoVariantIndex:
            typeof data.variantIndex === "number" ? data.variantIndex : undefined,
          discoveryWikipediaTitle: data.wikipediaTitle || stop.discoveryWikipediaTitle,
        };
        if (fetchedDataUrl) {
          // Nur ersetzen, wenn die neue Bildversion auch speicherbar ist.
          photoPatch.discoveryPhotoUrl = data.photoUrl as string;
          photoPatch.discoveryPhotoDataUrl = fetchedDataUrl;
        } else if (!keepCustomPhoto && data.photoUrl) {
          photoPatch.discoveryPhotoUrl = data.photoUrl as string;
        }
        // Sonst: vorhandenes (eigenes) Bild unangetastet lassen – nie mit undefined löschen.
        updateStopField(stopId, photoPatch);
      } finally {
        setStopBriefLoadingId(null);
      }
    },
    [currentRouteStops, locale, printablePhotoForStop, updateStopField],
  );

  const clearStopBrief = useCallback(
    (stopId: string) => {
      // Explizit gewollt: Ortsinfo inkl. Foto wirklich löschen.
      photoClearAllowRef.current.add(stopId);
      removeStopPhotoFromSidecar(trip.id, stopId);
      updateStopField(stopId, {
        discoveryDescription: "",
        discoveryPhotoUrl: undefined,
        discoveryPhotoDataUrl: undefined,
        discoveryPhotoVariantIndex: undefined,
        discoveryHighlights: undefined,
        discoveryWikipediaTitle: undefined,
        discoveryBriefSource: undefined,
        discoveryBriefQualityHint: undefined,
        discoveryIncludeInReport: false,
      });
      setExpandedStopBriefIds((prev) => ({ ...prev, [stopId]: false }));
    },
    [updateStopField, trip.id],
  );

  const toggleHotel = (id: string) => {
    const inCurrent = currentRouteStops.some((s) => s.id === id);
    if (inCurrent && isTransportTab) {
      updateCurrentStops(
        currentRouteStops.map((s) =>
          s.id === id ? { ...s, isHotel: !s.isHotel } : s
        )
      );
    } else {
      updateTrip({
        stops: trip.stops.map((s) =>
          s.id === id ? { ...s, isHotel: !s.isHotel } : s
        ),
      });
    }
  };

  const extractCityFromAddress = (addr: string): string => {
    const line = (addr || "").split("\n")[0];
    const plzMatch = line.match(/\b\d{4,5}\s+([^,\n]+)/);
    if (plzMatch) return plzMatch[1].trim();
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length >= 3) {
      if (/^\d/.test(parts[0]) || /\b(strasse|straße|weg|gasse|rue|route|via|avenue|road|str\.|chemin|place|boulevard|blvd)\b/i.test(parts[0])) {
        return parts[1].replace(/^\d{4,5}\s*/, "").trim();
      }
    }
    return parts[0].trim();
  };

  const etappen: Etappe[] = (() => {
    if (!routeInfo?.legs?.length) return [];
    const stops = currentRouteStops;

    const namedStops = stops.filter((s) => s.name.trim());
    const hotelStops = namedStops.filter((s) => s.type === "stop" && !!s.isHotel);

    if (hotelStops.length === 0) {
      const totalKm = routeInfo.legs.reduce((sum, l) => sum + l.distanceMeters, 0);
      const totalSec = routeInfo.legs.reduce((sum, l) => sum + l.durationSeconds, 0);
      const startName = stops.find((s) => s.type === "start")?.name || "Start";
      const endName = stops.find((s) => s.type === "end")?.name || "Ziel";
      return [{
        index: 0,
        label: "Etappe 1",
        from: startName,
        to: endName,
        legs: routeInfo.legs,
        distanceKm: Math.round(totalKm / 1000),
        durationFormatted: formatDur(totalSec),
      }];
    }

    const result: Etappe[] = [];
    let currentLegs: RouteLegInfo[] = [];
    let etappeIdx = 0;
    const startName2 = stops.find((s) => s.type === "start")?.name || "Start";
    let etappeFrom = startName2;

    for (let legIdx = 0; legIdx < routeInfo.legs.length; legIdx++) {
      const leg = routeInfo.legs[legIdx];
      currentLegs.push(leg);
      const toStop = namedStops[legIdx + 1];
      const isHotelSplitPoint = !!toStop && toStop.type === "stop" && !!toStop.isHotel;

      if (isHotelSplitPoint) {
        const km = currentLegs.reduce((s, l) => s + l.distanceMeters, 0);
        const sec = currentLegs.reduce((s, l) => s + l.durationSeconds, 0);
        result.push({
          index: etappeIdx,
          label: `Etappe ${etappeIdx + 1}`,
          from: etappeFrom,
          to: extractCityFromAddress(leg.to),
          legs: [...currentLegs],
          distanceKm: Math.round(km / 1000),
          durationFormatted: formatDur(sec),
          hotelBooked: !!(toStop.bookingConfirmation || toStop.bookingHotelName?.trim()),
          hotelName: toStop.bookingHotelName,
          hotelAddress: toStop.bookingAddress,
          hotelNights: toStop.hotelNights,
        });
        etappeFrom = extractCityFromAddress(leg.to);
        currentLegs = [];
        etappeIdx++;
      }
    }

    if (currentLegs.length > 0) {
      const km = currentLegs.reduce((s, l) => s + l.distanceMeters, 0);
      const sec = currentLegs.reduce((s, l) => s + l.durationSeconds, 0);
      const endName = stops.find((s) => s.type === "end")?.name || "Ziel";
      result.push({
        index: etappeIdx,
        label: `Etappe ${etappeIdx + 1}`,
        from: etappeFrom,
        to: endName,
        legs: [...currentLegs],
        distanceKm: Math.round(km / 1000),
        durationFormatted: formatDur(sec),
      });
    }

    return result;
  })();

  const pdfExportContext: PdfExportPlanContext = useMemo(
    () => ({
      etappenCount: etappen.length,
      hasRouteInfo: !!(routeInfo?.legs?.length || routeInfo?.distance),
    }),
    [etappen.length, routeInfo],
  );

  const applicablePdfExportDefs = useMemo(
    () => getApplicablePdfExportOptionDefs(trip, pdfExportContext),
    [trip, pdfExportContext],
  );

  const reorderRouteStopToInsertIndex = (dragId: string, insertIndex: number) => {
    const next = reorderStopsToInsertIndex(currentRouteStops, dragId, insertIndex);
    if (next) updateCurrentStops(next);
  };

  const makeRoundTrip = () => {
    updateCurrentStops(applyRoundTripShortcut(currentRouteStops));
  };

  const reverseRoute = () => {
    const stops = currentRouteStops;
    const start = stops.find((s) => s.type === "start");
    const end = stops.find((s) => s.type === "end");
    const waypoints = stops.filter((s) => s.type === "stop");
    if (!start || !end) return;

    const newStart: RouteStop = { ...start, name: end.name, lat: end.lat, lng: end.lng };
    const newEnd: RouteStop = { ...end, name: start.name, lat: start.lat, lng: start.lng };
    const reversedWaypoints = [...waypoints].reverse();

    updateCurrentStops(assignStopRoles([newStart, ...reversedWaypoints, newEnd]));
  };

  const handleOptimizeRoute = () => {
    const waypointStops = currentRouteStops.filter((s) => s.type === "stop" && s.name.trim());
    if (waypointStops.length < 2) return;
    if (waypointStops.length > 23) {
      setRouteError(tt("routeOptimizeLimit"));
      return;
    }
    setOptimizeRoute(true);
  };

  const handleStopsReordered = useCallback((orderedIds: string[]) => {
    updateCurrentStops((prevStops) => {
      if (orderedIds.length !== prevStops.length) return prevStops;
      const lookup: Record<string, RouteStop> = {};
      for (const s of prevStops) lookup[s.id] = s;
      const reordered = orderedIds
        .map((id) => lookup[id])
        .filter((s): s is RouteStop => !!s);
      return reordered.length === prevStops.length ? assignStopRoles(reordered) : prevStops;
    });
    setOptimizeRoute(false);
  }, [updateCurrentStops]);

  const addToBucketList = (item: Omit<BucketListItem, "id" | "added">) => {
    const newItem: BucketListItem = {
      ...item,
      id: `bl_${Date.now()}`,
      added: new Date().toISOString(),
    };
    updateTrip({ bucketList: [...trip.bucketList, newItem] });
  };

  const removeFromBucketList = (id: string) => {
    updateTrip({ bucketList: trip.bucketList.filter((b) => b.id !== id) });
  };

  const travelModes = [
    { id: "auto" as TravelMode, label: t("tabAuto"), icon: Car },
  ];

  const defaultModules: string[] = ["route", "hotels", "report", "bucket"];
  const activeModules = trip.modules?.length ? trip.modules : defaultModules;

  const allTabs = useMemo(
    () => [
      { id: "route" as const, label: t("tabRoute"), icon: Car, module: "route" },
      { id: "ortsinfo" as const, label: tt("tabOrtsinfo"), icon: Info, module: "route" },
      { id: "hotels" as const, label: t("tabHotels"), icon: Hotel, module: "hotels" },
      { id: "poi" as const, label: t("tabPoi"), icon: Compass, module: "poi" },
      { id: "report" as const, label: t("tabReport"), icon: FileDown, module: "report" },
      { id: "bucket" as const, label: t("tabBucket"), icon: BookmarkPlus, module: "bucket" },
      { id: "flights" as const, label: t("tabFlights"), icon: Plane, module: "flights" },
      { id: "car" as const, label: t("tabCar"), icon: Car, module: "car" },
      { id: "train" as const, label: t("tabTrain"), icon: Train, module: "train" },
      { id: "esim" as const, label: t("tabEsim"), icon: Smartphone, module: "esim" },
      { id: "droneMaps" as const, label: t("tabDroneMaps"), icon: Map, module: "droneMaps" },
      { id: "insurance" as const, label: t("tabInsurance"), icon: Shield, module: "insurance" },
    ],
    [t, tt],
  );

  const tabs = allTabs.filter(
    (tab) => activeModules.includes(tab.module) && isCatalogModuleActive(tab.module),
  );
  const isHotelOnlyMode = tabs.length === 1 && tabs[0].id === "hotels";

  useEffect(() => {
    if (tabs.length === 1 && activeTab !== tabs[0].id) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const hasHotelsTab = tabs.some((tab) => tab.id === "hotels");

  const hotelTabStops = (() => {
    const seen = new Set<string>();
    return [
      ...trip.stops,
      ...(trip.routes?.flights?.stops || []),
      ...(trip.routes?.car?.stops || []),
      ...(trip.routes?.train?.stops || []),
    ].filter((s) => {
      if ((s.type !== "stop" && s.type !== "end") || !s.name.trim()) return false;
      const key = `${s.id}:${s.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).filter((s) => s.isHotel);
  })();
  const hotelRoomValues = Array.from(new Set(hotelTabStops.map((s) => s.hotelRooms || 1)));
  const commonHotelRooms = hotelRoomValues.length === 1 ? hotelRoomValues[0] : null;

  const toggleHotelPanel = (stopId: string, panel: "search" | "booking") => {
    setHotelPanels((prev) => {
      const next = { ...prev };
      if (next[stopId] === panel) delete next[stopId];
      else next[stopId] = panel;
      return next;
    });
  };

  const openHotelStop = (stopId: string, openBooking: boolean) => {
    setHotelFocus({ stopId, openBooking });
    setHotelPanels((prev) => ({ ...prev, [stopId]: openBooking ? "booking" : "search" }));
    setActiveTab("hotels");
  };

  useEffect(() => {
    if (activeTab !== "hotels" || !hotelFocus) return;
    const scrollTimer = window.setTimeout(() => {
      document.getElementById(`hotel-stop-${hotelFocus.stopId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
    const clearTimer = window.setTimeout(() => setHotelFocus(null), 2500);
    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [activeTab, hotelFocus]);

  const toggleModule = (mod: string) => {
    const current = trip.modules?.length ? [...trip.modules] : defaultModules;
    const updated = current.includes(mod)
      ? current.filter((m) => m !== mod)
      : [...current, mod];
    if (updated.length === 0) return;
    updateTrip({ modules: updated as Trip["modules"] });
  };

  const destination = trip.stops.find((s) => s.type === "end")?.name || "";
  const origin = trip.stops.find((s) => s.type === "start")?.name || "";
  const currentOrigin = currentRouteStops.find((s) => s.type === "start")?.name || "";
  const currentDestination = currentRouteStops.find((s) => s.type === "end")?.name || "";

  const searchParams = {
    destination,
    origin,
    checkIn: trip.startDate,
    checkOut: trip.endDate,
    travelers: trip.travelers,
  };

  const hotelOnlySearchParams = {
    destination: hotelOnlyDestination,
    checkIn: hotelOnlyCheckIn,
    checkOut: hotelOnlyCheckOut,
    travelers: hotelOnlyTravelers || trip.travelers,
    rooms: hotelOnlyRooms || 1,
  };

  const hotelOnlyNights = (() => {
    const ci = hotelOnlyCheckIn;
    const co = hotelOnlyCheckOut;
    if (!ci || !co) return 2;
    const [cy, cm, cd] = ci.split("-").map(Number);
    const [oy, om, od] = co.split("-").map(Number);
    const cDate = new Date(cy, cm - 1, cd);
    const oDate = new Date(oy, om - 1, od);
    const diff = Math.round((oDate.getTime() - cDate.getTime()) / 86400000);
    return Math.max(1, diff || 1);
  })();
  const showTripNameEditor = isEditingTripName;
  const coverTitleColor = trip.pdfCoverTitleColor || "#007aff";
  const coverDateColor = trip.pdfCoverDateColor || "#007aff";
  const coverTitleSize = Math.max(18, Math.min(64, Number(trip.pdfCoverTitleSize) || 32));
  const coverDateSize = Math.max(10, Math.min(36, Number(trip.pdfCoverDateSize) || 14));
  const coverTitleFont = trip.pdfCoverTitleFont || "helvetica";
  const coverDateFont = trip.pdfCoverDateFont || "helvetica";
  const coverTitleAlign = trip.pdfCoverTitleAlign === "left" || trip.pdfCoverTitleAlign === "right" ? trip.pdfCoverTitleAlign : "center";
  const coverDateAlign = trip.pdfCoverDateAlign === "left" || trip.pdfCoverDateAlign === "right" ? trip.pdfCoverDateAlign : "center";
  const coverMiniTitleSize = Math.min(14, Math.max(8, coverTitleSize * 0.34));
  const coverMiniDateSize = Math.min(11, Math.max(7, coverDateSize * 0.5));
  const coverIsPortrait = typeof coverAspectRatio === "number" ? coverAspectRatio < 1 : false;
  const previewModeFor = (style: "background" | "belowTitle"): "background" | "belowTitle" =>
    style === "background" && coverIsPortrait ? "background" : "belowTitle";
  const coverFontFamily = (font: string): string => {
    if (font === "times") return "Times New Roman, Times, serif";
    if (font === "courier") return "Courier New, Courier, monospace";
    return "Helvetica, Arial, sans-serif";
  };

  useEffect(() => {
    if (!trip.pdfCoverPhotoDataUrl) {
      setCoverAspectRatio(null);
      return;
    }
    let cancelled = false;
    void import("@/lib/tripPhotoStore").then(({ ensureThumbUrl }) =>
      ensureThumbUrl(trip.pdfCoverPhotoDataUrl!).then((src) => {
        if (cancelled || !src) return;
        const img = new Image();
        img.onload = () => {
          if (img.width > 0 && img.height > 0) {
            setCoverAspectRatio(img.width / img.height);
          }
        };
        img.onerror = () => setCoverAspectRatio(null);
        img.src = src;
      })
    );
    return () => {
      cancelled = true;
    };
  }, [trip.pdfCoverPhotoDataUrl]);

  const logAffiliateClick = useCallback(
    (module: string, provider: string, targetUrl: string, context?: Record<string, unknown>) => {
      void trackAffiliateClick({
        module,
        provider,
        targetUrl,
        tripId: trip.id,
        userId: user?.id,
        destination: destination || undefined,
        origin: origin || undefined,
        context,
      });
    },
    [trip.id, user?.id, destination, origin]
  );

  const createAffiliateClickRef = useCallback(() => {
    const ts = Date.now().toString(36);
    const rnd = Math.random().toString(36).slice(2, 8);
    return `snf-${ts}-${rnd}`;
  }, []);

  const openExpediaAffiliateLink = useCallback(
    (params: Parameters<typeof buildExpediaHotelLink>[0], context?: Record<string, unknown>) => {
      const targetUrl = buildExpediaHotelLink({
        ...params,
        clickRef: createAffiliateClickRef(),
      });
      logAffiliateClick("hotels", partnerLabelFromUrl(targetUrl).brandName, targetUrl, context);
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    },
    [createAffiliateClickRef, logAffiliateClick]
  );

  const openHotelsComAffiliateLink = useCallback(
    (params: Parameters<typeof buildHotelsComLink>[0], context?: Record<string, unknown>) => {
      const targetUrl = buildHotelsComLink(params);
      logAffiliateClick("hotels", partnerLabelFromUrl(targetUrl).brandName, targetUrl, context);
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    },
    [logAffiliateClick]
  );

  const displayPOIs: { name: string; category: string; rating: number; description: string; photoUrl?: string }[] =
    pois.length > 0
      ? pois.map((p) => ({ name: p.name, category: p.category, rating: p.rating, description: p.address, photoUrl: p.photoUrl }))
      : destination
      ? []
      : [
          { name: "Sagrada Família", category: "Sehenswürdigkeit", rating: 4.8, description: "Gaudís berühmte Basilika" },
          { name: "Park Güell", category: "Park", rating: 4.6, description: "Bunter Mosaikpark von Gaudí" },
          { name: "La Boqueria", category: "Markt", rating: 4.5, description: "Berühmter Lebensmittelmarkt" },
          { name: "Casa Batlló", category: "Architektur", rating: 4.7, description: "Meisterwerk des Modernisme" },
        ];

  const [poiScope, setPoiScope] = useState<"route" | "destination" | "ai">("ai");

  const interestOptions = useMemo((): { id: TravelInterest; label: string; emoji: string }[] => {
    const ids: TravelInterest[] = [
      "kultur",
      "natur",
      "kulinarik",
      "straende",
      "fotospots",
      "familien",
      "abenteuer",
      "shopping",
    ];
    const emoji: Record<TravelInterest, string> = {
      kultur: "🏰",
      natur: "🌿",
      kulinarik: "🍷",
      straende: "🏖",
      fotospots: "📸",
      familien: "🎢",
      abenteuer: "🥾",
      shopping: "🛍",
    };
    return ids.map((id) => ({
      id,
      label: tt(`interest_${id}`),
      emoji: emoji[id],
    }));
  }, [tt]);

  const toggleInterest = (interest: TravelInterest) => {
    const current = trip.interests || [];
    const updated = current.includes(interest)
      ? current.filter((i) => i !== interest)
      : [...current, interest];
    updateTrip({ interests: updated });
  };

  const loadPOIs = useCallback(async (scope: "route" | "destination") => {
    const routeStopNames = trip.stops.filter((s) => s.name.trim()).map((s) => s.name);
    const key = scope === "route" ? `route:${routeStopNames.join(",")}` : `dest:${destination}`;
    if (key === poisSearchedFor) return;
    setPoisLoading(true);
    setPoisSearchedFor(key);
    try {
      if (scope === "route" && routeStopNames.length >= 2) {
        const results = await searchPOIsAlongRoute(routeStopNames);
        setPois(results);
      } else if (destination) {
        const results = await searchPOIs(destination);
        setPois(results);
      } else {
        setPois([]);
      }
    } catch {
      setPois([]);
    } finally {
      setPoisLoading(false);
    }
  }, [poisSearchedFor, trip.stops, destination]);

  const [aiLoadingEtappe, setAiLoadingEtappe] = useState<number | null>(null);
  const [aiPoiPhotos, setAiPoiPhotos] = useState<Record<string, string>>({});

  const cleanWikipediaText = useCallback((value: string): string => {
    return (value || "")
      .replace(/Vorlage:[^\n.?!]*/gi, " ")
      .replace(/\bWikidata\b/gi, " ")
      .replace(/\s*\[[^\]]+\]\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const isWeakWikipediaText = useCallback((value: string): boolean => {
    const v = (value || "").toLowerCase();
    if (!v) return true;
    if (v.includes("vorlage:") || v.includes("wikidata")) return true;
    if (v.includes("begriffsklärung")) return true;
    return cleanWikipediaText(value).length < 120;
  }, [cleanWikipediaText]);

  const fetchWikipediaPageByTitle = useCallback(async (
    title: string
  ): Promise<{ title: string; extract: string; thumbnail?: string; lat?: number; lng?: number } | undefined> => {
    const query = (title || "").trim();
    if (!query) return undefined;
    const endpoints = wikipediaSummaryUrls(query, locale);
    for (const url of endpoints) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const data = await resp.json();
        const resolvedTitle = (data?.title || query).toString().trim() || query;
        // Skip wiki namespace/meta pages like "Vorlage:*", "Kategorie:*", etc.
        if (resolvedTitle.includes(":")) continue;
        const extract = cleanWikipediaText((data?.extract || "").toString().trim());
        if (extract) {
          const rawLat = data?.coordinates?.lat;
          const rawLng = data?.coordinates?.lon;
          const lat = typeof rawLat === "number" ? rawLat : undefined;
          const lng = typeof rawLng === "number" ? rawLng : undefined;
          return {
            title: resolvedTitle,
            extract,
            thumbnail: (data?.thumbnail?.source || "").toString().trim() || undefined,
            lat,
            lng,
          };
        }
      } catch {
        // try next endpoint
      }
    }
    return undefined;
  }, [cleanWikipediaText, locale]);

  const fetchWikipediaIntroExtract = useCallback(async (title: string): Promise<string | undefined> => {
    const query = (title || "").trim();
    if (!query) return undefined;
    const endpoints = wikipediaIntroExtractUrls(query, locale);
    for (const url of endpoints) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const data = await resp.json();
        const pages = data?.query?.pages;
        if (!pages || typeof pages !== "object") continue;
        const pageEntries = Object.values(pages) as Array<{ extract?: unknown }>;
        const extract = cleanWikipediaText((pageEntries.find((p) => typeof p?.extract === "string")?.extract || "")
          .toString()
          .replace(/\s+/g, " ")
          .trim());
        if (extract) return extract;
      } catch {
        // try next endpoint
      }
    }
    return undefined;
  }, [cleanWikipediaText, locale]);

  const clampWikiText = useCallback((value: string, maxLength = 900): string => {
    const normalized = (value || "").replace(/\s+/g, " ").trim();
    if (normalized.length <= maxLength) return normalized;
    const clipped = normalized.slice(0, maxLength);
    const lastDot = clipped.lastIndexOf(".");
    if (lastDot > Math.floor(maxLength * 0.55)) return clipped.slice(0, lastDot + 1).trim();
    return `${clipped.trim()}...`;
  }, []);

  const fetchWikipediaSummaryByTitle = useCallback(async (title: string): Promise<string | undefined> => {
    const page = await fetchWikipediaPageByTitle(title);
    if (!page?.extract) return undefined;
    const intro = await fetchWikipediaIntroExtract(page.title || title);
    const bestText = (intro && intro.length > page.extract.length) ? intro : page.extract;
    const cleaned = cleanWikipediaText(bestText);
    if (!cleaned || isWeakWikipediaText(cleaned)) return undefined;
    return clampWikiText(cleaned, 900);
  }, [fetchWikipediaPageByTitle, fetchWikipediaIntroExtract, clampWikiText, cleanWikipediaText, isWeakWikipediaText]);

  const normalizeWikiKey = useCallback((value: string): string => {
    return (value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }, []);

  const fetchWikipediaOpenSearchTitles = useCallback(async (query: string): Promise<string[]> => {
    const q = (query || "").trim();
    if (!q) return [];
    const endpoints = wikipediaOpenSearchUrls(q, locale);
    const allTitles: string[] = [];
    for (const url of endpoints) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const data = await resp.json();
        const titles = Array.isArray(data?.[1]) ? data[1].map((t: unknown) => String(t || "").trim()) : [];
        for (const title of titles) {
          if (title && !allTitles.includes(title)) allTitles.push(title);
        }
      } catch {
        // try next endpoint
      }
    }
    return allTitles;
  }, [locale]);

  const pickBestWikipediaTitle = useCallback((query: string, titles: string[]): string | undefined => {
    if (!titles.length) return undefined;
    const nq = normalizeWikiKey(query);
    if (!nq) return titles[0];

    const qTokens = nq.split(" ").filter(Boolean);
    let bestTitle: string | undefined;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const title of titles) {
      const nt = normalizeWikiKey(title);
      if (!nt) continue;
      const tTokens = nt.split(" ").filter(Boolean);
      const shared = tTokens.filter((t) => qTokens.includes(t)).length;
      const tokenRatio = qTokens.length ? shared / qTokens.length : 0;
      const starts = nt.startsWith(nq) ? 1 : 0;
      const contains = nt.includes(nq) ? 1 : 0;
      const reverseContains = nq.includes(nt) ? 1 : 0;
      const lenPenalty = Math.abs(nt.length - nq.length);
      const score =
        (nt === nq ? 200 : 0) +
        contains * 80 +
        reverseContains * 40 +
        starts * 20 +
        tokenRatio * 70 -
        lenPenalty;
      if (score > bestScore) {
        bestScore = score;
        bestTitle = title;
      }
    }
    return bestTitle ?? titles[0];
  }, [normalizeWikiKey]);

  const fetchWikipediaTitleByCoords = useCallback(async (lat?: number, lng?: number): Promise<string | undefined> => {
    if (typeof lat !== "number" || typeof lng !== "number") return undefined;
    const endpoints = wikipediaGeosearchUrls(lat, lng, locale);
    for (const url of endpoints) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const data = await resp.json();
        const title = (data?.query?.geosearch?.[0]?.title || "").toString().trim();
        if (title) return title;
      } catch {
        // try next endpoint
      }
    }
    return undefined;
  }, [locale]);

  const fetchWikipediaSummaryForPoi = useCallback(
    async (name: string, lat?: number, lng?: number): Promise<string | undefined> => {
      const byName = await fetchWikipediaSummaryByTitle(name);
      if (byName) return byName;
      const openSearchTitles = await fetchWikipediaOpenSearchTitles(name);
      const bestOpenSearchTitle = pickBestWikipediaTitle(name, openSearchTitles);
      if (bestOpenSearchTitle) {
        const byOpenSearchTitle = await fetchWikipediaSummaryByTitle(bestOpenSearchTitle);
        if (byOpenSearchTitle) return byOpenSearchTitle;
      }
      const nearbyTitle = await fetchWikipediaTitleByCoords(lat, lng);
      if (!nearbyTitle) return undefined;
      return await fetchWikipediaSummaryByTitle(nearbyTitle);
    },
    [fetchWikipediaSummaryByTitle, fetchWikipediaOpenSearchTitles, pickBestWikipediaTitle, fetchWikipediaTitleByCoords]
  );

  const enrichAiPoisWithWikipedia = useCallback(async (items: AiPoiSuggestion[]): Promise<AiPoiSuggestion[]> => {
    return await Promise.all(
      items.map(async (poi) => {
        const wikiText = await fetchWikipediaSummaryForPoi(poi.name, poi.lat, poi.lng);
        return wikiText ? { ...poi, description: wikiText } : poi;
      })
    );
  }, [fetchWikipediaSummaryForPoi]);

  const loadAiPoisForEtappe = useCallback(async (eIdx: number) => {
    if (etappen.length === 0) return;
    setAiLoadingEtappe(eIdx);
    setAiPoisError(null);
    try {
      const rawResults = await fetchAiPois({
        etappes: etappen,
        interests: trip.interests || [],
        travelMode: trip.travelMode,
        stops: trip.stops,
        etappeIndex: eIdx,
        language: asAppLocale(locale),
      });
      const results = await enrichAiPoisWithWikipedia(rawResults);
      setAiPois((prev) => [...prev.filter((p) => p.etappeIndex !== eIdx), ...results]);

      if (window.google?.maps?.places) {
        const { fetchPlacePhoto } = await import("@/lib/poiService");
        for (const poi of results) {
          if (!aiPoiPhotos[poi.name]) {
            fetchPlacePhoto(poi.name).then((url) => {
              if (url) setAiPoiPhotos((prev) => ({ ...prev, [poi.name]: url }));
            });
          }
        }
      }
    } catch (err) {
      setAiPoisError(err instanceof Error ? err.message : tt("aiFail"));
    } finally {
      setAiLoadingEtappe(null);
    }
  }, [etappen, trip.interests, trip.travelMode, trip.stops, aiPoiPhotos, enrichAiPoisWithWikipedia, locale, tt]);

  const loadAllAiPois = useCallback(async () => {
    if (etappen.length === 0) return;
    setAiPoisLoading(true);
    setAiPoisError(null);
    setAiPois([]);
    try {
      const rawResults = await fetchAiPois({
        etappes: etappen,
        interests: trip.interests || [],
        travelMode: trip.travelMode,
        stops: trip.stops,
        language: asAppLocale(locale),
      });
      const results = await enrichAiPoisWithWikipedia(rawResults);
      setAiPois(results);

      if (window.google?.maps?.places) {
        const { fetchPlacePhoto } = await import("@/lib/poiService");
        for (const poi of results) {
          fetchPlacePhoto(poi.name).then((url) => {
            if (url) setAiPoiPhotos((prev) => ({ ...prev, [poi.name]: url }));
          });
        }
      }
    } catch (err) {
      setAiPoisError(err instanceof Error ? err.message : tt("aiFail"));
      setAiPois([]);
    } finally {
      setAiPoisLoading(false);
    }
  }, [etappen, trip.interests, trip.travelMode, trip.stops, enrichAiPoisWithWikipedia, locale, tt]);

  useEffect(() => {
    if (activeTab === "poi" && poiScope !== "ai") {
      loadPOIs(poiScope);
    }
  }, [activeTab, poiScope, loadPOIs]);

  useEffect(() => {
    if (activeTab !== "report" && openPhotoPickerEtappe != null) {
      setOpenPhotoPickerEtappe(null);
    }
  }, [activeTab, openPhotoPickerEtappe]);

  const isInBucketList = (name: string) =>
    trip.bucketList.some((b) => b.name === name);

  const addLandmarkPoiToBucket = useCallback(
    (poi: MapHighlightPoi) => {
      if (isInBucketList(poi.name)) return;
      addToBucketList({
        name: poi.name,
        category: poi.category || tt("sightseeingCategory"),
        rating: poi.rating ?? 0,
        description: poi.description || "",
        lat: poi.lat,
        lng: poi.lng,
        wikipediaTitle: poi.wikipediaTitle,
      });
    },
    [addToBucketList, isInBucketList]
  );

  const addBucketPoiAsStop = useCallback(
    (poi: MapHighlightPoi) => {
      const endIdx = currentRouteStops.findIndex((s) => s.type === "end");
      const insertIdx = endIdx >= 0 ? endIdx : currentRouteStops.length;
      const discoveryEtappeIndex = Math.max(
        0,
        currentRouteStops
          .slice(0, insertIdx)
          .filter((s) => s.type === "stop" && !!s.isHotel).length
      );
      const bucketItem = trip.bucketList.find((b) => b.id === poi.id || b.name === poi.name);
      void addStopSmart(poi.name, poi.lat, poi.lng, {
        discoverySource: "bucket",
        discoveryCategory: poi.category || bucketItem?.category || "Bucket List",
        discoveryEtappeIndex,
        discoveryAddedAt: new Date().toISOString(),
        discoveryWikipediaTitle: bucketItem?.wikipediaTitle,
      });
    },
    [addStopSmart, currentRouteStops, trip.bucketList]
  );

  useEffect(() => {
    if ((!showBucketOnMap && activeTab !== "bucket") || !autocompleteReady) return;
    let cancelled = false;
    void (async () => {
      const pending = trip.bucketList.filter((item) => item.lat == null && item.lng == null);
      if (pending.length === 0 || !window.google?.maps) return;

      const resolved: Array<{ id: string; lat: number; lng: number }> = [];
      for (const item of pending) {
        try {
          const geocoder = new google.maps.Geocoder();
          const res = await geocoder.geocode({ address: item.name });
          const loc = res.results?.[0]?.geometry?.location;
          if (loc) {
            resolved.push({ id: item.id, lat: loc.lat(), lng: loc.lng() });
          }
        } catch {
          // ignore geocode errors
        }
      }

      if (cancelled || resolved.length === 0) return;

      setBucketGeocoded((prev) => {
        const next = { ...prev };
        for (const row of resolved) next[row.id] = { lat: row.lat, lng: row.lng };
        return next;
      });

      updateTrip((prev) => ({
        ...prev,
        bucketList: prev.bucketList.map((item) => {
          const hit = resolved.find((row) => row.id === item.id);
          return hit ? { ...item, lat: hit.lat, lng: hit.lng } : item;
        }),
      }));
    })();
    return () => {
      cancelled = true;
    };
  }, [showBucketOnMap, activeTab, trip.bucketList, autocompleteReady, updateTrip]);

  const filteredCatalogLandmarks = useMemo(() => {
    if (!landmarksLoaded) return [];
    return filterLandmarks(landmarks, {
      query: landmarkQuery,
      category: landmarkCategory,
      continent: landmarkContinent,
      unescoOnly: landmarkUnescoOnly,
    });
  }, [
    landmarks,
    landmarksLoaded,
    landmarkQuery,
    landmarkCategory,
    landmarkContinent,
    landmarkUnescoOnly,
  ]);

  const catalogLandmarkMapMarkers = useMemo((): MapHighlightPoi[] => {
    const inBucketNames = new Set(trip.bucketList.map((b) => b.name));
    return filteredCatalogLandmarks
      .filter((lm) => Number.isFinite(lm.latitude) && Number.isFinite(lm.longitude))
      .map((lm) => landmarkToMapPoi(lm, inBucketNames.has(lm.name)));
  }, [filteredCatalogLandmarks, trip.bucketList]);

  const bucketTabWorldwide = bucketDiscoveryScope === "worldwide" || !!landmarkQuery.trim();

  const bucketTabFilteredLandmarks = useMemo(() => {
    if (!landmarksLoaded) return [];
    const source = bucketTabWorldwide
      ? landmarks
      : filterLandmarksAlongRoute(landmarks, trip.stops, 120);
    return filterLandmarks(source, {
      query: landmarkQuery,
      category: landmarkCategory,
      continent: landmarkContinent,
      unescoOnly: landmarkUnescoOnly,
    });
  }, [
    landmarks,
    landmarksLoaded,
    bucketTabWorldwide,
    trip.stops,
    landmarkQuery,
    landmarkCategory,
    landmarkContinent,
    landmarkUnescoOnly,
  ]);

  const bucketTabMapMarkers = useMemo((): MapHighlightPoi[] => {
    const inBucketNames = new Set(trip.bucketList.map((b) => b.name));
    return bucketTabFilteredLandmarks
      .filter((lm) => Number.isFinite(lm.latitude) && Number.isFinite(lm.longitude))
      .map((lm) => landmarkToMapPoi(lm, inBucketNames.has(lm.name)));
  }, [bucketTabFilteredLandmarks, trip.bucketList]);

  const bucketTabFitPositions = useMemo(
    () =>
      trip.stops
        .filter((s) => s.name.trim() && Number.isFinite(s.lat) && Number.isFinite(s.lng))
        .map((s) => ({ lat: s.lat as number, lng: s.lng as number })),
    [trip.stops]
  );

  const bucketListMapMarkers = useMemo((): MapHighlightPoi[] => {
    if (!showBucketOnMap) return [];
    return catalogLandmarkMapMarkers;
  }, [showBucketOnMap, catalogLandmarkMapMarkers]);

  const isInCurrentRoute = useCallback(
    (name: string) => {
      const key = normalizePlaceKey(name);
      return currentRouteStops.some((s) => normalizePlaceKey(s.name) === key);
    },
    [currentRouteStops]
  );

  const aiStopActionKey = useCallback((etappeIndex: number, poiName: string) => {
    return `${etappeIndex}:${normalizePlaceKey(poiName)}`;
  }, []);
  const customStopActionKey = useCallback((etappeIndex: number, poiName: string) => {
    return `${etappeIndex}:${normalizePlaceKey(poiName)}`;
  }, []);

  const isDiscoveryLinkedInCurrentRoute = useCallback(
    (etappeIndex: number, poiName: string) => {
      const key = normalizePlaceKey(poiName);
      return currentRouteStops.some(
        (s) =>
          s.type === "stop" &&
          normalizePlaceKey(s.name) === key &&
          !!s.discoverySource &&
          s.discoveryEtappeIndex === etappeIndex
      );
    },
    [currentRouteStops]
  );

  const addAiPoiToRoute = useCallback(
    async (poi: AiPoiSuggestion, etappeIndex: number) => {
      const actionKey = aiStopActionKey(etappeIndex, poi.name);
      if (addingAiStops[actionKey] || isInCurrentRoute(poi.name)) return;
      setAddingAiStops((prev) => ({ ...prev, [actionKey]: true }));
      try {
        let photoUrl: string | undefined = aiPoiPhotos[poi.name];
        let photoDataUrl: string | undefined;
        if (!photoUrl && window.google?.maps?.places) {
          try {
            const { fetchPlacePhoto } = await import("@/lib/poiService");
            photoUrl = await fetchPlacePhoto(poi.name) || undefined;
            if (photoUrl) {
              setAiPoiPhotos((prev) => ({ ...prev, [poi.name]: photoUrl as string }));
            }
          } catch {
            // keep going without photo
          }
        }
        if (photoUrl) {
          photoDataUrl = await imageUrlToPrintableDataUrl(photoUrl);
        }
        const inserted = await addStopSmart(poi.name, poi.lat, poi.lng, {
          discoverySource: "ai",
          discoveryEtappeIndex: etappeIndex,
          discoveryCategory: poi.category,
          discoveryDescription: poi.description,
          discoveryPhotoUrl: photoUrl,
          discoveryPhotoDataUrl: photoDataUrl,
          discoveryAddedAt: new Date().toISOString(),
        });
        if (inserted) {
          setAddedAiStops((prev) => ({ ...prev, [actionKey]: true }));
        }
      } finally {
        setAddingAiStops((prev) => {
          const next = { ...prev };
          delete next[actionKey];
          return next;
        });
      }
    },
    [aiPoiPhotos, aiStopActionKey, addStopSmart, addingAiStops, isInCurrentRoute]
  );

  const addAiPoiToBucket = useCallback(
    (poi: AiPoiSuggestion) => {
      if (isInBucketList(poi.name)) return;
      addToBucketList({
        name: poi.name,
        category: poi.category,
        rating: 0,
        description: poi.description,
        lat: poi.lat,
        lng: poi.lng,
      });
    },
    [addToBucketList, isInBucketList]
  );

  const searchCustomDiscovery = useCallback(async (etappeIndex: number) => {
    const query = (customStopQuery[etappeIndex] || "").trim();
    if (!query) return;
    setCustomStopLoading((prev) => ({ ...prev, [etappeIndex]: true }));
    try {
      let pageTitle = query;
      let description = "";
      let photoUrl: string | undefined;
      let lat: number | undefined;
      let lng: number | undefined;

      const exactPage = await fetchWikipediaPageByTitle(query);
      if (exactPage) {
        pageTitle = exactPage.title || query;
        description = (await fetchWikipediaSummaryByTitle(pageTitle)) || exactPage.extract || "";
        photoUrl = exactPage.thumbnail;
        lat = exactPage.lat;
        lng = exactPage.lng;
      }

      if (!description || isWeakWikipediaText(description)) {
        const titles = await fetchWikipediaOpenSearchTitles(query);
        const bestTitle = pickBestWikipediaTitle(query, titles);
        if (bestTitle) {
          const bestPage = await fetchWikipediaPageByTitle(bestTitle);
          if (bestPage) {
            pageTitle = bestPage.title || bestTitle;
            description = (await fetchWikipediaSummaryByTitle(pageTitle)) || bestPage.extract || "";
            photoUrl = bestPage.thumbnail;
            lat = bestPage.lat;
            lng = bestPage.lng;
          } else {
            pageTitle = bestTitle;
          }
        }
      }

      if (!photoUrl && window.google?.maps?.places) {
        try {
          const { fetchPlacePhoto } = await import("@/lib/poiService");
          photoUrl = (await fetchPlacePhoto(pageTitle || query)) || undefined;
        } catch {
          // keep fallback without photo
        }
      }

      if (!description || isWeakWikipediaText(description)) {
        try {
          const aiResp = await fetch("/api/place-summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: pageTitle || query, language: asAppLocale(locale) }),
          });
          if (aiResp.ok) {
            const aiData = await aiResp.json();
            description = cleanWikipediaText((aiData?.summary || "").toString().trim());
          }
        } catch {
          // keep static fallback below
        }
      }

      setCustomStopResult((prev) => ({
        ...prev,
        [etappeIndex]: {
          name: pageTitle || query,
          category: tt("customStopCategory"),
          description: description || tt("poiFallback", { name: query }),
          photoUrl,
          lat,
          lng,
        },
      }));
    } catch {
      setCustomStopResult((prev) => ({
        ...prev,
        [etappeIndex]: {
          name: query,
          category: tt("customStopCategory"),
          description: tt("poiFallback", { name: query }),
        },
      }));
    } finally {
      setCustomStopLoading((prev) => ({ ...prev, [etappeIndex]: false }));
    }
  }, [customStopQuery, fetchWikipediaPageByTitle, fetchWikipediaOpenSearchTitles, pickBestWikipediaTitle, fetchWikipediaSummaryByTitle, isWeakWikipediaText, cleanWikipediaText, locale, tt]);

  const addCustomDiscoveryToRoute = useCallback(async (etappeIndex: number) => {
    const result = customStopResult[etappeIndex];
    if (!result) return;
    const actionKey = customStopActionKey(etappeIndex, result.name);
    if (addingCustomStops[actionKey]) return;
    if (isDiscoveryLinkedInCurrentRoute(etappeIndex, result.name)) return;
    setAddingCustomStops((prev) => ({ ...prev, [actionKey]: true }));
    let lat = result.lat;
    let lng = result.lng;
    try {
      if (lat == null || lng == null) {
        const geo = await geocodeStop({ id: "tmp-custom-stop", name: result.name, type: "stop" });
        if (geo) {
          lat = geo.lat;
          lng = geo.lng;
        }
      }
      const wantedKey = normalizePlaceKey(result.name);
      const existingIdx = currentRouteStops.findIndex(
        (s) => s.type === "stop" && normalizePlaceKey(s.name) === wantedKey
      );
      const photoDataUrl = result.photoUrl ? await imageUrlToPrintableDataUrl(result.photoUrl) : undefined;
      if (existingIdx >= 0) {
        const updatedStops = currentRouteStops.map((s, idx) =>
          idx !== existingIdx
            ? s
            : {
                ...s,
                discoverySource: "custom" as const,
                discoveryEtappeIndex: etappeIndex,
                discoveryCategory: result.category,
                discoveryDescription: result.description,
                discoveryPhotoUrl: result.photoUrl,
                discoveryPhotoDataUrl: photoDataUrl,
                discoveryAddedAt: new Date().toISOString(),
              }
        );
        updateCurrentStops(updatedStops);
        return;
      }
      const inserted = await addStopSmart(result.name, lat, lng, {
        discoverySource: "custom",
        discoveryEtappeIndex: etappeIndex,
        discoveryCategory: result.category,
        discoveryDescription: result.description,
        discoveryPhotoUrl: result.photoUrl,
        discoveryPhotoDataUrl: photoDataUrl,
        discoveryAddedAt: new Date().toISOString(),
      });
      if (!inserted && !isInCurrentRoute(result.name)) return;
    } finally {
      setAddingCustomStops((prev) => {
        const next = { ...prev };
        delete next[actionKey];
        return next;
      });
    }
  }, [
    addStopSmart,
    customStopActionKey,
    customStopResult,
    geocodeStop,
    addingCustomStops,
    isDiscoveryLinkedInCurrentRoute,
    currentRouteStops,
    updateCurrentStops,
  ]);

  const getSelectedPdfPhotosForEtappe = useCallback(
    (etappeIndex: number): string[] => {
      return trip.pdfPhotosByEtappe?.[String(etappeIndex)] || [];
    },
    [trip.pdfPhotosByEtappe]
  );

  const getPdfPhotoLibraryForEtappe = useCallback(
    (etappeIndex: number): string[] => {
      const key = String(etappeIndex);
      const lib = trip.pdfPhotoLibraryByEtappe?.[key] || [];
      const selected = trip.pdfPhotosByEtappe?.[key] || [];
      return Array.from(new Set([...lib, ...selected]));
    },
    [trip.pdfPhotoLibraryByEtappe, trip.pdfPhotosByEtappe]
  );

  useEffect(() => {
    const allUrls = Array.from(
      new Set([
        ...Object.values(trip.pdfPhotosByEtappe || {}).flat(),
        ...Object.values(trip.pdfPhotoLibraryByEtappe || {}).flat(),
      ])
    ).filter(Boolean);
    const missing = allUrls.filter((url) => !photoAspectByUrl[url]);
    if (missing.length === 0) return;
    let cancelled = false;
    void (async () => {
      const { ensureThumbUrl } = await import("@/lib/tripPhotoStore");
      for (const url of missing) {
        const src = await ensureThumbUrl(url);
        if (cancelled || !src) continue;
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            if (!cancelled && img.naturalWidth && img.naturalHeight) {
              const aspect = img.naturalWidth / img.naturalHeight;
              setPhotoAspectByUrl((prev) => (prev[url] ? prev : { ...prev, [url]: aspect }));
            }
            resolve();
          };
          img.onerror = () => resolve();
          img.src = src;
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [photoAspectByUrl, trip.pdfPhotoLibraryByEtappe, trip.pdfPhotosByEtappe]);

  const togglePdfPhotoForEtappe = useCallback(
    (etappeIndex: number, photoUrl: string) => {
      updateTrip((prev) => {
        const key = String(etappeIndex);
        const existing = prev.pdfPhotosByEtappe?.[key] || [];
        const nextList = existing.includes(photoUrl)
          ? existing.filter((u) => u !== photoUrl)
          : [...existing, photoUrl];
        return {
          ...prev,
          pdfPhotosByEtappe: {
            ...(prev.pdfPhotosByEtappe || {}),
            [key]: nextList,
          },
        };
      });
    },
    [updateTrip]
  );

  const setPdfPhotoAtSlot = useCallback(
    (etappeIndex: number, slotIndex: number, photoUrl: string) => {
      updateTrip((prev) => {
        const key = String(etappeIndex);
        const existing = [...(prev.pdfPhotosByEtappe?.[key] || [])];
        const without = existing.filter((u) => u !== photoUrl);
        const insertAt = Math.max(0, Math.min(slotIndex, without.length));
        without.splice(insertAt, 0, photoUrl);
        const nextLibrary = Array.from(new Set([...(prev.pdfPhotoLibraryByEtappe?.[key] || []), photoUrl]));
        return {
          ...prev,
          pdfPhotosByEtappe: {
            ...(prev.pdfPhotosByEtappe || {}),
            [key]: without,
          },
          pdfPhotoLibraryByEtappe: {
            ...(prev.pdfPhotoLibraryByEtappe || {}),
            [key]: nextLibrary,
          },
        };
      });
    },
    [updateTrip]
  );

  const movePdfPhotoSlot = useCallback(
    (etappeIndex: number, fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      updateTrip((prev) => {
        const key = String(etappeIndex);
        const arr = [...(prev.pdfPhotosByEtappe?.[key] || [])];
        if (fromIndex < 0 || fromIndex >= arr.length) return prev;
        const [item] = arr.splice(fromIndex, 1);
        const boundedTarget = Math.max(0, Math.min(toIndex, arr.length));
        arr.splice(boundedTarget, 0, item);
        return {
          ...prev,
          pdfPhotosByEtappe: {
            ...(prev.pdfPhotosByEtappe || {}),
            [key]: arr,
          },
        };
      });
    },
    [updateTrip]
  );

  const setPdfPhotoPlacementForEtappe = useCallback(
    (etappeIndex: number, placement: PdfPhotoPlacement) => {
      updateTrip((prev) => ({
        ...prev,
        pdfPhotoPlacementByEtappe: {
          ...(prev.pdfPhotoPlacementByEtappe || {}),
          [String(etappeIndex)]: placement,
        },
      }));
    },
    [updateTrip]
  );

  const setPdfPhotoLayoutForEtappe = useCallback(
    (etappeIndex: number, layout: PdfPhotoLayout) => {
      updateTrip((prev) => ({
        ...prev,
        pdfPhotoLayoutByEtappe: {
          ...(prev.pdfPhotoLayoutByEtappe || {}),
          [String(etappeIndex)]: layout,
        },
      }));
    },
    [updateTrip]
  );

  const setPdfPhotoPagesForEtappe = useCallback(
    (etappeIndex: number, pageCount: number) => {
      const safe = Math.max(1, Math.min(12, pageCount || 1));
      updateTrip((prev) => ({
        ...prev,
        pdfPhotoPagesByEtappe: {
          ...(prev.pdfPhotoPagesByEtappe || {}),
          [String(etappeIndex)]: safe,
        },
      }));
    },
    [updateTrip]
  );

  const addPickedPdfPhotosToEtappe = useCallback(
    async (etappeIndex: number, files: FileList | null) => {
      if (!files || files.length === 0) return;
      const tripId = trip.id;
      const picked = Array.from(files).slice(0, 40);
      const { ingestPhotoFile } = await import("@/lib/tripPhotoStore");
      const refs = (
        await Promise.all(
          picked.map(async (file) => {
            if (!file.type.startsWith("image/")) return undefined;
            return await ingestPhotoFile(tripId, file);
          })
        )
      ).filter((u): u is string => !!u);
      if (refs.length === 0) return;
      updateTrip((prev) => {
        const key = String(etappeIndex);
        const existing = prev.pdfPhotosByEtappe?.[key] || [];
        const library = prev.pdfPhotoLibraryByEtappe?.[key] || [];
        const mergedLibrary = Array.from(new Set([...library, ...refs]));
        return {
          ...prev,
          pdfPhotosByEtappe: {
            ...(prev.pdfPhotosByEtappe || {}),
            [key]: Array.from(new Set([...existing, ...refs])),
          },
          pdfPhotoLibraryByEtappe: {
            ...(prev.pdfPhotoLibraryByEtappe || {}),
            [key]: mergedLibrary,
          },
        };
      });
    },
    [trip.id, updateTrip]
  );

  const setPdfCoverStyle = useCallback(
    (style: "background" | "belowTitle") => {
      updateTrip((prev) => ({ ...prev, pdfCoverPhotoStyle: style }));
    },
    [updateTrip]
  );

  const setPdfCoverPhoto = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const first = Array.from(files)[0];
      if (!first?.type?.startsWith("image/")) return;
      const { ingestPhotoFile } = await import("@/lib/tripPhotoStore");
      const ref = await ingestPhotoFile(trip.id, first);
      if (!ref) return;
      updateTrip((prev) => {
        writeTripCoverPhoto(prev.id, ref);
        return { ...prev, pdfCoverPhotoDataUrl: ref };
      });
    },
    [trip.id, updateTrip]
  );

  const clearPdfCoverPhoto = useCallback(() => {
    updateTrip((prev) => {
      removeTripCoverPhoto(prev.id);
      return { ...prev, pdfCoverPhotoDataUrl: undefined };
    });
  }, [updateTrip]);

  const getFirstPageSlotCount = useCallback((layout: PdfPhotoLayout): number => {
    if (layout === "onePerPageMax") return 1;
    if (layout === "onePortraitTopHalf" || layout === "onePortraitBottomHalf") return 1;
    if (layout === "twoPortraitSideBySide") return 2;
    if (layout === "twoPortraitStacked" || layout === "twoMixedStacked") return 2;
    if (layout === "threePortraitOneLandscape") return 4;
    return 6;
  }, []);

  const getRecommendedPdfLayouts = useCallback(
    (photoUrls: string[]): PdfPhotoLayout[] => {
      const count = photoUrls.length;
      if (count === 0) return ["auto", "smartPages", "grid"];
      const portraitCount = photoUrls.reduce((sum, url) => {
        const aspect = photoAspectByUrl[url];
        return sum + (aspect ? (aspect < 1 ? 1 : 0) : 1);
      }, 0);
      const landscapeCount = Math.max(0, count - portraitCount);

      if (count === 1) {
        return ["onePerPageMax", "onePortraitTopHalf", "onePortraitBottomHalf", "smartPages"];
      }
      if (count === 2 && landscapeCount === 0) {
        return ["twoPortraitSideBySide", "twoPortraitStacked", "onePerPageMax", "smartPages"];
      }
      if (count === 2 && landscapeCount > 0) {
        return ["twoMixedStacked", "twoPortraitStacked", "onePerPageMax", "smartPages"];
      }
      if (count >= 6 && landscapeCount === 0) {
        return ["sixPortraitGrid", "grid", "smartPages", "onePerPageMax"];
      }
      if (count >= 4 && portraitCount >= 3 && landscapeCount >= 1) {
        return ["threePortraitOneLandscape", "grid", "smartPages", "onePerPageMax"];
      }
      return ["grid", "smartPages", "twoPortraitSideBySide", "onePerPageMax"];
    },
    [photoAspectByUrl]
  );

  const assignPhotoToEtappeSlot = useCallback(
    (etappeIndex: number, photoUrl: string, preferredSlot?: number) => {
      const selected = getSelectedPdfPhotosForEtappe(etappeIndex);
      const layoutPref = trip.pdfPhotoLayoutByEtappe?.[String(etappeIndex)] || "auto";
      const effectiveLayout = layoutPref === "auto" ? (getRecommendedPdfLayouts(selected)[0] || "grid") : layoutPref;
      const slotCount = getFirstPageSlotCount(effectiveLayout);
      const firstEmpty = selected.length < slotCount ? selected.length : -1;
      const target = typeof preferredSlot === "number"
        ? preferredSlot
        : firstEmpty >= 0
          ? firstEmpty
          : selected.length;
      setPdfPhotoAtSlot(etappeIndex, target, photoUrl);
    },
    [getFirstPageSlotCount, getRecommendedPdfLayouts, getSelectedPdfPhotosForEtappe, setPdfPhotoAtSlot, trip.pdfPhotoLayoutByEtappe]
  );

  const getStopCoordsByName = useCallback(
    (name: string): { lat: number; lng: number } | null => {
      const key = normalizePlaceKey(name);
      const stop = trip.stops.find((s) => {
        const stopKey = normalizePlaceKey(s.name);
        return stopKey === key || stopKey.includes(key) || key.includes(stopKey);
      });
      if (stop?.lat != null && stop.lng != null) return { lat: stop.lat, lng: stop.lng };
      return null;
    },
    [trip.stops]
  );

  useEffect(() => {
    if (openEtappeMapIndex == null || !autocompleteReady || !window.google?.maps || !etappeMapRef.current) return;

    const etappe = etappen[openEtappeMapIndex];
    if (!etappe) return;

    const map = new google.maps.Map(etappeMapRef.current, {
      center: { lat: 47.3769, lng: 8.5417 },
      zoom: 7,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const infoWindow = new google.maps.InfoWindow();
    const bounds = new google.maps.LatLngBounds();
    const pointsForLine: google.maps.LatLngLiteral[] = [];
    const etappePois = aiPois.filter((p) => p.etappeIndex === openEtappeMapIndex && p.lat != null && p.lng != null);

    const clearMapElements = () => {
      etappeMapMarkersRef.current.forEach((m) => m.setMap(null));
      etappeMapMarkersRef.current = [];
      if (etappeMapLineRef.current) {
        etappeMapLineRef.current.setMap(null);
        etappeMapLineRef.current = null;
      }
      if (etappeMapRouteRendererRef.current) {
        etappeMapRouteRendererRef.current.setMap(null);
        etappeMapRouteRendererRef.current = null;
      }
    };

    clearMapElements();

    const fromCoords = getStopCoordsByName(etappe.from);
    const toCoords = getStopCoordsByName(etappe.to);
    if (fromCoords) {
      pointsForLine.push(fromCoords);
      bounds.extend(fromCoords);
      const marker = new google.maps.Marker({
        map,
        position: fromCoords,
        label: { text: "A", color: "white", fontWeight: "700" },
        title: `Start: ${etappe.from}`,
      });
      etappeMapMarkersRef.current.push(marker);
    }
    if (toCoords) {
      pointsForLine.push(toCoords);
      bounds.extend(toCoords);
      const marker = new google.maps.Marker({
        map,
        position: toCoords,
        label: { text: "B", color: "white", fontWeight: "700" },
        title: `Ziel: ${etappe.to}`,
      });
      etappeMapMarkersRef.current.push(marker);
    }

    etappePois.forEach((poi, idx) => {
      if (poi.lat == null || poi.lng == null) return;
      const poiInRoute = isInCurrentRoute(poi.name);
      const pos = { lat: poi.lat, lng: poi.lng };
      bounds.extend(pos);
      const marker = new google.maps.Marker({
        map,
        position: pos,
        label: { text: String(idx + 1), color: "white", fontWeight: "700" },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 11,
          fillColor: poiInRoute ? "#16a34a" : "#8b5cf6",
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 2,
        },
        title: poi.name,
      });
      marker.addListener("click", () => {
        const safeName = poi.name.replace(/[^\w-]/g, "_");
        const addBtnId = `etappe-map-add-${openEtappeMapIndex}-${safeName}`;
        const bucketBtnId = `etappe-map-bucket-${openEtappeMapIndex}-${safeName}`;
        infoWindow.setContent(
          `<div style="font-family:system-ui;max-width:260px;padding:4px 2px">
            <div style="font-size:13px;font-weight:700;color:#111827">${poi.name}</div>
            <div style="font-size:11px;color:#6b7280;margin-top:3px">${poi.category}</div>
            <div style="font-size:12px;color:#374151;margin-top:7px;line-height:1.45">${poi.description}</div>
            <div style="display:flex;gap:8px;margin-top:10px">
              <button id="${addBtnId}" ${poiInRoute ? "disabled" : ""} style="border:none;background:${poiInRoute ? "#10b981" : "#2563eb"};color:white;padding:6px 10px;border-radius:8px;font-size:11px;cursor:${poiInRoute ? "default" : "pointer"}">${poiInRoute ? "In Route" : "Zur Route"}</button>
              <button id="${bucketBtnId}" style="border:1px solid #d1d5db;background:white;color:#374151;padding:6px 10px;border-radius:8px;font-size:11px;cursor:pointer">{t("tabBucket")}</button>
            </div>
          </div>`
        );
        infoWindow.open(map, marker);
        google.maps.event.addListenerOnce(infoWindow, "domready", () => {
          const addBtn = document.getElementById(addBtnId);
          if (!poiInRoute) {
            addBtn?.addEventListener("click", () => {
              void addAiPoiToRoute(poi, openEtappeMapIndex);
              infoWindow.close();
            });
          }
          const bucketBtn = document.getElementById(bucketBtnId);
          bucketBtn?.addEventListener("click", () => {
            addAiPoiToBucket(poi);
            infoWindow.close();
          });
        });
      });
      etappeMapMarkersRef.current.push(marker);
    });

    const fitMapToBounds = () => {
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 64);
      }
    };

    const drawFallbackLine = () => {
      if (pointsForLine.length < 2) return;
      etappeMapLineRef.current = new google.maps.Polyline({
        map,
        path: pointsForLine,
        geodesic: true,
        strokeColor: "#6366f1",
        strokeOpacity: 0.9,
        strokeWeight: 4,
      });
    };

    const drawEtappeRoute = async () => {
      if (!fromCoords || !toCoords) {
        drawFallbackLine();
        fitMapToBounds();
        return;
      }
      try {
        const service = new google.maps.DirectionsService();
        const viaNames = etappe.legs.slice(0, -1).map((l) => l.to);
        const waypoints = viaNames
          .map((name) => getStopCoordsByName(name))
          .filter((p): p is { lat: number; lng: number } => !!p)
          .map((p) => ({ location: p, stopover: true }));

        const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          service.route(
            {
              origin: fromCoords,
              destination: toCoords,
              waypoints,
              travelMode: google.maps.TravelMode.DRIVING,
              optimizeWaypoints: false,
            },
            (res, status) => {
              if (status === google.maps.DirectionsStatus.OK && res) resolve(res);
              else reject(status);
            }
          );
        });

        etappeMapRouteRendererRef.current = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          preserveViewport: true,
          polylineOptions: {
            strokeColor: "#6366f1",
            strokeOpacity: 0.9,
            strokeWeight: 4,
          },
        });
        etappeMapRouteRendererRef.current.setDirections(result);
        const routePath = result.routes[0]?.overview_path || [];
        routePath.forEach((pt) => bounds.extend(pt));
      } catch {
        drawFallbackLine();
      } finally {
        fitMapToBounds();
      }
    };

    void drawEtappeRoute();

    return () => {
      clearMapElements();
      infoWindow.close();
    };
  }, [
    aiPois,
    addAiPoiToBucket,
    addAiPoiToRoute,
    autocompleteReady,
    etappen,
    getStopCoordsByName,
    isInCurrentRoute,
    openEtappeMapIndex,
  ]);

  const getAiDiscoveriesForEtappe = useCallback(
    (etappeIndex: number) => {
      const seen = new Set<string>();
      return trip.stops.filter((s) => {
        if (s.type !== "stop" || !s.discoverySource || s.discoveryEtappeIndex !== etappeIndex) return false;
        const key = normalizePlaceKey(s.name);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    [trip.stops]
  );

  const handleDownloadPDF = async () => {
    setPdfExportError(null);
    if (endStopLooksLikeTripTitleOnly(trip)) {
      setPdfExportError(ROUTE_TITLE_AS_DESTINATION_MESSAGE);
      return;
    }
    // Open window immediately (in click context) to avoid popup blocker
    const pdfWindow = window.open("", "_blank");
    if (pdfWindow) {
      const creating = t("pdfCreating");
      pdfWindow.document.write(
        `<html><head><title>${creating}</title></head><body style='display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#555'><p>${creating}</p></body></html>`,
      );
    }
    setPdfGenerating(true);
    setPdfProgress(0);
    setPdfProgressMsg(tt("pdfStart"));
    try {
      const { generateTripPDF } = await import("@/lib/pdfService");
      const tripForPdf = hydrateTripMedia(syncTripRouteStops(trip));
      const blob = await generateTripPDF({
        trip: tripForPdf,
        etappen,
        contentLocale: asAppLocale(locale),
        routeInfo: routeInfo ? { distance: routeInfo.distance, duration: routeInfo.duration, stops: routeInfo.stops } : undefined,
        googleApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "AIzaSyDTcV42T-ZkriZOB8RtNZMtGR8gZq3Izi0",
        onProgress: (pct, msg) => {
          setPdfProgress(pct);
          setPdfProgressMsg(msg);
        },
      });
      const url = URL.createObjectURL(blob);
      if (pdfWindow) {
        pdfWindow.location.href = url;
      } else {
        window.open(url, "_blank");
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
      pdfWindow?.close();
      setPdfExportError("PDF konnte nicht erstellt werden. Bitte erneut versuchen.");
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <input
        ref={icsFileInputRef}
        type="file"
        accept=".ics,text/calendar"
        className="hidden"
        onChange={handleIcsBookingFile}
      />
      {/* PDF Generation Overlay */}
      {pdfGenerating && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("pdfCreating")}</h3>
            <p className="text-sm text-gray-500 mb-4">{pdfProgressMsg}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${pdfProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">{pdfProgress}%</p>
          </div>
        </div>
      )}

      {showPdfExportModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowPdfExportModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{tt("pdfExportTitle")}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {tt("pdfExportHint")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPdfExportModal(false)}
                className="w-8 h-8 rounded-full border border-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {applicablePdfExportDefs.length === 0 ? (
                <p className="col-span-full text-sm text-gray-500 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
                  {tt("pdfNoOptionalModal")}
                </p>
              ) : null}
              {applicablePdfExportDefs.map((def) => (
                <label
                  key={def.key}
                  className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50 p-3 cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isPdfExportOptionEnabled(trip, def.key, pdfExportContext)}
                    onChange={(ev) => updateTrip({ [def.tripField]: ev.target.checked })}
                    className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gray-900">
                      {tt(def.labelKey as Parameters<typeof tt>[0])}
                    </span>
                    <span className="block text-[11px] text-gray-500 leading-snug mt-0.5">
                      {tt(def.descKey as Parameters<typeof tt>[0])}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPdfExportModal(false);
                  setActiveTab("report");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                {tt("editCoverSheet")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPdfExportModal(false);
                  void handleDownloadPDF();
                }}
                disabled={pdfGenerating}
                className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0077ed] disabled:opacity-50"
              >
                <FileDown className="w-4 h-4" />{tt("pdfCreate")}</button>
            </div>
          </div>
        </div>
      )}

      {openEtappeMapIndex != null && etappen[openEtappeMapIndex] && (
        <div className="fixed inset-0 z-[95] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80 font-medium">
                  Etappe {openEtappeMapIndex + 1} Kartenansicht
                </p>
                <p className="text-sm font-semibold">
                  {etappen[openEtappeMapIndex].from} → {etappen[openEtappeMapIndex].to}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenEtappeMapIndex(null)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
                title={tt("closeMap")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-gray-50 border-b border-gray-200 text-xs text-gray-600">{tt("highlightHint")}</div>
            <div ref={etappeMapRef} className="h-[560px] w-full" />
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="sticky top-0 z-50 relative bg-gradient-to-r from-blue-600 to-cyan-500 pt-5 pb-0 shadow-[0_8px_20px_-10px_rgba(15,23,42,0.45)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {showTripNameEditor ? (
                  <input
                    ref={tripNameInputRef}
                    type="text"
                    value={trip.name === "Neue Reise" ? "" : trip.name}
                    onChange={(e) => updateTrip({ name: e.target.value })}
                    onBlur={() => {
                      if (!trip.name?.trim()) updateTrip({ name: "Neue Reise" });
                      setIsEditingTripName(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        (e.currentTarget as HTMLInputElement).blur();
                      }
                    }}
                    placeholder={t("newTrip")}
                    className="w-[320px] max-w-[70vw] bg-white/10 border border-white/35 rounded-xl px-4 py-2 text-2xl font-bold text-white placeholder:text-white/65 focus:outline-none focus:ring-2 focus:ring-white/60"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-white">
                      {trip.name}
                    </h1>
                    <button
                      type="button"
                      onClick={() => setIsEditingTripName(true)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/25 text-white transition-colors"
                      title={t("editTripName")}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {(() => {
                const start = trip.stops.find((s) => s.type === "start")?.name;
                const end = trip.stops.find((s) => s.type === "end")?.name;
                const dateStr = trip.startDate && trip.endDate
                  ? `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`
                  : "";
                const routeStr = start && end ? `${start} → ${end}` : "";
                const line = [routeStr, dateStr].filter(Boolean).join(" · ");
                return line ? <p className="text-blue-100 text-sm">{line}</p> : null;
              })()}
            </div>

            <div className="flex items-center gap-2">
              {/* Auto-Save Status */}
              {saveStatus === "saved" && (
                <span className="inline-flex items-center gap-1.5 text-xs text-green-100 bg-green-500/20 px-3 py-1.5 rounded-lg">
                  <Check className="w-3.5 h-3.5" />{t("saved")}</span>
              )}

              <button
                onClick={() => setShowTips((v) => !v)}
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all border border-white/20"
                title={t("toggleTips")}
              >
                <Sparkles className="w-4 h-4" />
                {showTips ? t("tipsOff") : t("tipsOn")}
              </button>
              {hasUnsavedChanges && saveStatus === "idle" && (
                <span className="inline-flex items-center gap-1.5 text-xs text-blue-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />{t("saving")}</span>
              )}

              {/* PDF Download */}
              <button
                onClick={() => setShowPdfExportModal(true)}
                disabled={pdfGenerating}
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all border border-white/20 disabled:opacity-50"
                title={t("pdfTitle")}
              >
                {pdfGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                <span className="hidden sm:inline">PDF</span>
              </button>

              {/* Trip List Toggle */}
              <button
                onClick={() => setShowTripList(!showTripList)}
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all border border-white/20"
              >
                <FolderOpen className="w-4 h-4" />
                {chrome("myTrips")}
              </button>

              {/* New Trip */}
              <button
                onClick={handleNewTrip}
                className="inline-flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-all"
              >
                <Plus className="w-4 h-4" />{t("newTrip")}</button>
            </div>
          </div>

          {/* Tabs + Module settings in header */}
          <div className="relative mt-3">
            {canScrollLeft && (
              <button
                onClick={() => {
                  tabsRef.current?.scrollBy({ left: -200, behavior: "smooth" });
                }}
                className="absolute -left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-white/85 border border-white/60 rounded-full shadow-md hover:shadow-lg hover:bg-white transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-blue-700" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div
                ref={tabsRef}
                onScroll={checkTabScroll}
                className="relative flex-1 flex gap-1.5 rounded-t-2xl overflow-x-auto pt-1.5 px-1.5"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      const el = tabsRef.current;
                      const btn = el?.querySelector(`[data-tab="${tab.id}"]`) as HTMLElement | null;
                      if (el && btn) btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
                    }}
                    data-tab={tab.id}
                    className={`relative flex items-center gap-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? "z-20 bg-gray-50 text-blue-700 border border-blue-200 border-b-gray-50 px-5 py-3 rounded-tl-xl rounded-tr-xl rounded-bl-none rounded-br-none shadow-none translate-y-1"
                        : "z-10 px-4 py-2.5 bg-blue-600/55 text-white border border-blue-300/45 rounded-t-xl rounded-b-md shadow-[0_2px_5px_rgba(15,23,42,0.18)] hover:bg-blue-600/65 hover:-translate-y-0.5"
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-blue-500" : ""}`} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowModuleSettings(!showModuleSettings)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${
                    showModuleSettings
                      ? "bg-white text-blue-600 border-blue-200"
                      : "bg-blue-400/25 border-blue-300/50 text-white hover:bg-white/20"
                  }`}
                  title={t("manageModules")}
                >
                  <Settings className="w-4 h-4" />
                </button>

                {showModuleSettings && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowModuleSettings(false)} />
                    <div className="absolute right-0 top-12 z-40 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 w-64">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{tt("modulesToggle")}</h3>
                      <div className="space-y-1.5">
                        {allTabs
                          .filter((tab) => isCatalogModuleActive(tab.module))
                          .map((tab) => {
                          const isActive = activeModules.includes(tab.module);
                          return (
                            <button
                              key={tab.id}
                              onClick={() => toggleModule(tab.module)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                                isActive
                                  ? "bg-blue-50 text-blue-700 font-medium"
                                  : "text-gray-500 hover:bg-gray-50"
                              }`}
                            >
                              <tab.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-500" : "text-gray-400"}`} />
                              <span className="flex-1 text-left">{tab.label}</span>
                              {isActive && <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            {canScrollRight && (
              <button
                onClick={() => {
                  tabsRef.current?.scrollBy({ left: 200, behavior: "smooth" });
                }}
                className="absolute -right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-white/85 border border-white/60 rounded-full shadow-md hover:shadow-lg hover:bg-white transition-all"
              >
                <ChevronRight className="w-4 h-4 text-blue-700" />
              </button>
            )}
          </div>
          {/* Trip List */}
          {showTripList && (
            <div className="mt-4">
              {savedTrips.length === 0 ? (
                <div className="bg-white/10 rounded-2xl p-6 text-center text-white/60 text-sm">{tt("noSavedTrips")}</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {savedTrips.map((savedTrip) => {
                    const isActive = savedTrip.id === trip.id;
                    return (
                      <button
                        key={savedTrip.id}
                        onClick={() => handleLoadTrip(savedTrip.id)}
                        className={`relative group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                          isActive
                            ? "bg-white text-gray-900 shadow-lg ring-2 ring-blue-400"
                            : "bg-white/15 text-white hover:bg-white/25 border border-white/20"
                        }`}
                      >
                        <span className="truncate max-w-[180px]">{getTripDisplayName(savedTrip)}</span>
                        {isActive && (
                          <span className="text-[10px] text-blue-600 font-semibold bg-blue-100 px-1.5 py-0.5 rounded-full flex-shrink-0">{tt("activeTripBadge")}</span>
                        )}
                        <button
                          onClick={(e) => handleDeleteTrip(savedTrip.id, e)}
                          className="p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="relative z-40 isolate">
      <TripLocalFileBar
        trip={trip}
        getLatestTrip={() => tripLatestRef.current}
        onTripImported={handleTripFileImported}
        onFileWriteAfterBrowserSave={persistBrowserCopyForFile}
      />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {saveBlockedMessage && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {saveBlockedMessage}
          </div>
        )}
        <div
          className={
            activeTab === "report" || activeTab === "ortsinfo"
              ? "block max-w-3xl"
              : "grid lg:grid-cols-[380px_1fr] gap-8"
          }
        >
          {/* Left Panel */}
          {activeTab !== "report" && (
          <div className="space-y-6">
            {/* Route Stops - only for transport tabs */}
            {activeTab === "ortsinfo" && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{tt("ortsinfoTitle")}</h3>
                <div className="space-y-2">
                  {trip.stops.filter((s) => s.name.trim()).length === 0 ? (
                    <p className="text-sm text-gray-500">{tt("ortsinfoNeedStops")}</p>
                  ) : (
                    trip.stops
                      .filter((s) => s.name.trim())
                      .map((stop) => (
                        <RouteStopBriefPanel
                            key={stop.id}
                            stop={stop}
                            layout="list"
                            expanded={!!expandedStopBriefIds[stop.id]}
                            onToggleExpand={() =>
                              setExpandedStopBriefIds((prev) => ({
                                ...prev,
                                [stop.id]: !prev[stop.id],
                              }))
                            }
                            loading={stopBriefLoadingId === stop.id}
                            included={stopBriefIncluded(stop)}
                            onSetIncluded={(on) => void setStopBriefPdfIncluded(stop.id, on)}
                            onClearBrief={() => clearStopBrief(stop.id)}
                            onLoadBrief={() => void enrichStopBrief(stop.id, { force: true })}
                            onSaveDescription={(text) =>
                              updateStopField(stop.id, {
                                discoveryDescription: text,
                                discoverySource: "manual",
                                discoveryBriefSource: "manual",
                                discoveryLanguage: asAppLocale(locale),
                              })
                            }
                            onPhotoDataUrl={(dataUrl) => {
                              void (async () => {
                                if (dataUrl) {
                                  writeStopPhotoToSidecar(trip.id, stop.id, dataUrl);
                                  updateStopField(stop.id, {
                                    discoveryPhotoUrl: dataUrl,
                                    discoveryPhotoDataUrl: dataUrl,
                                    discoverySource: "manual",
                                  });
                                  return;
                                }
                                const url = stop.discoveryPhotoUrl;
                                const printable =
                                  url && stopBriefIncluded(stop)
                                    ? await imageUrlToPrintableDataUrl(url)
                                    : stop.discoveryPhotoDataUrl;
                                updateStopField(stop.id, {
                                  discoveryPhotoUrl: url,
                                  discoveryPhotoDataUrl: printable,
                                  discoverySource: stop.discoverySource || "manual",
                                });
                              })();
                            }}
                            onReloadPhoto={() => void refreshStopBriefPhoto(stop.id, "reload")}
                            onAlternatePhoto={() => void refreshStopBriefPhoto(stop.id, "alternate")}
                            imageUrlToDataUrl={imageUrlToPrintableDataUrl}
                            fileToDataUrl={fileToPrintableDataUrl}
                          />
                      ))
                  )}
                </div>
              </div>
            )}

            {isTransportTab && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {activeTab === "route"
                    ? t("tabRoute")
                    : activeTab === "flights"
                      ? tt("routeTitleFlights")
                      : activeTab === "car"
                        ? tt("routeTitleCar")
                        : activeTab === "train"
                          ? tt("routeTitleTrain")
                          : tt("routeTitle")}
                </h3>
              </div>
              <div className="mb-4 space-y-2">
                <p className="text-xs font-medium text-gray-500">{tt("addVia")}</p>
                <button
                  onClick={addQuickStopDraft}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />{tt("addVia")}</button>
                {quickStopDrafts.map((draft) => (
                  <div key={draft.id}>
                    <input
                      type="text"
                      value={draft.name}
                      ref={(el) => {
                        if (el && autocompleteReady) {
                          attachAutocomplete(el, (place, lat, lng) => {
                            void commitQuickStopDraft(draft.id, { name: place, lat: lat ?? undefined, lng: lng ?? undefined });
                          });
                        }
                      }}
                      onChange={(e) =>
                        setQuickStopDrafts((prev) =>
                          prev.map((d) => (d.id === draft.id ? { ...d, name: e.target.value, lat: undefined, lng: undefined } : d))
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void commitQuickStopDraft(draft.id);
                        }
                      }}
                      placeholder={tt("addViaPh")}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
              <div
                className="space-y-3 relative"
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDropInsertIndex(null);
                  }
                }}
              >
                {currentRouteStops.length > 1 && (
                  <div className="absolute left-[22px] top-[28px] bottom-[28px] w-0.5 bg-gradient-to-b from-blue-400 via-gray-200 to-red-400 z-0" />
                )}
                {currentRouteStops.map((stop, stopIndex) => (
                    (() => {
                      const stopBadgeLabel =
                        stop.type === "start"
                          ? "A"
                          : stop.type === "end"
                            ? "B"
                            : String(stopIndex);
                      const showInsertLine =
                        !!draggingRouteStopId &&
                        dropInsertIndex === stopIndex &&
                        isActiveRouteStopInsert(draggingRouteStopId, stopIndex, currentRouteStops);
                      return (
                    <Fragment key={`${trip.id}-${stop.id}`}>
                      {showInsertLine && (
                        <div className="relative z-20 -my-1 py-0.5 pointer-events-none" aria-hidden>
                          <div className="flex items-center gap-2 pl-9 pr-1">
                            <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500 ring-2 ring-blue-200" />
                            <div className="h-[3px] flex-1 rounded-full bg-blue-500" />
                          </div>
                        </div>
                      )}
                    <div
                      className={`relative flex items-center gap-2 z-10 rounded-xl py-1 transition-opacity ${
                        draggingRouteStopId === stop.id ? "opacity-40" : ""
                      }`}
                      onDragOver={(e) => {
                        if (!draggingRouteStopId || draggingRouteStopId === stop.id) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        const rect = e.currentTarget.getBoundingClientRect();
                        const insertIdx = resolveRouteStopInsertIndex(
                          stopIndex,
                          e.clientY,
                          rect.top,
                          rect.height,
                          currentRouteStops.length
                        );
                        if (isActiveRouteStopInsert(draggingRouteStopId, insertIdx, currentRouteStops)) {
                          setDropInsertIndex(insertIdx);
                        } else {
                          setDropInsertIndex(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const dragId = e.dataTransfer.getData("text/plain") || draggingRouteStopId;
                        if (!dragId) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const insertIdx =
                          dropInsertIndex ??
                          resolveRouteStopInsertIndex(
                            stopIndex,
                            e.clientY,
                            rect.top,
                            rect.height,
                            currentRouteStops.length
                          );
                        reorderRouteStopToInsertIndex(dragId, insertIdx);
                        setDraggingRouteStopId(null);
                        setDropInsertIndex(null);
                      }}
                    >
                      <button
                        type="button"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", stop.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDraggingRouteStopId(stop.id);
                        }}
                        onDragEnd={() => {
                          setDraggingRouteStopId(null);
                          setDropInsertIndex(null);
                        }}
                        className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none"
                        title={tt("moveStop")}
                        aria-label={tt("moveStop")}
                      >
                        <GripVertical className="w-5 h-5" />
                      </button>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          stop.type === "start"
                            ? "bg-blue-500"
                            : stop.type === "end" && stop.isHotel
                            ? "bg-gradient-to-br from-red-500 to-purple-500"
                            : stop.type === "end"
                            ? "bg-red-500"
                            : stop.isHotel && (stop.bookingConfirmation || stop.bookingHotelName?.trim())
                            ? "bg-green-500"
                            : stop.isHotel
                            ? "bg-purple-500"
                            : "bg-orange-400"
                        }`}
                      >
                        <span className="text-white text-sm font-bold leading-none">{stopBadgeLabel}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {stop.isHotel && (stop.bookingConfirmation || stop.bookingHotelName?.trim()) ? (
                          <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
                            <p className="text-sm font-medium text-green-900 truncate">
                              {stop.bookingHotelName || stop.name}
                            </p>
                            {stop.bookingAddress && (
                              <p className="text-[11px] text-green-700 truncate">{stop.bookingAddress}</p>
                            )}
                            <p className="text-[10px] text-green-500 mt-0.5">
                              {stop.name}{stop.bookingPrice ? ` · ${stop.bookingPrice}` : ""}
                            </p>
                          </div>
                        ) : (
                        <input
                          type="text"
                          value={stop.name}
                          ref={(el) => {
                            if (el && autocompleteReady) {
                              attachAutocomplete(el, (place, lat, lng) => {
                                if (lat != null && lng != null && stop.type === "stop") {
                                  void updateStopWithCoords(stop.id, place, lat, lng);
                                } else if (lat != null && lng != null) {
                                  updateStopField(stop.id, { name: place, lat, lng });
                                } else {
                                  updateStop(stop.id, place);
                                }
                              });
                            }
                          }}
                          onChange={(e) => updateStop(stop.id, e.target.value)}
                          placeholder={
                            stop.type === "start"
                              ? tt("startPh")
                              : stop.type === "end"
                                ? tt("destPh")
                                : stop.isHotel
                                  ? tt("hotelPlacePh")
                                  : tt("stopPh")
                          }
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        )}
                      </div>
                      {(stop.type === "stop" || stop.type === "end") &&
                        !(stop.isHotel && (stop.bookingConfirmation || stop.bookingHotelName?.trim())) && (
                        <button
                          onClick={() => toggleHotel(stop.id)}
                          className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${
                            stop.isHotel
                              ? "text-purple-500 bg-purple-50 hover:bg-purple-100"
                              : "text-gray-300 hover:text-purple-500 hover:bg-purple-50"
                          }`}
                          title={
                            stop.isHotel
                              ? tt("removeHotel")
                              : stop.type === "end"
                                ? tt("markDestHotel")
                                : tt("markHotel")
                          }
                        >
                          <BedDouble className="w-4 h-4" />
                        </button>
                      )}
                      {stop.type === "stop" &&
                        !(stop.isHotel && (stop.bookingConfirmation || stop.bookingHotelName?.trim())) && (
                        <button
                          onClick={() => removeStop(stop.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                          title={tt("removeStop")}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    </Fragment>
                      );
                    })()
                ))}
              </div>
              {currentRouteStops.length >= 2 && (
                <button
                  type="button"
                  onClick={makeRoundTrip}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-white"
                >
                  <Route className="w-3.5 h-3.5" />{tt("roundTripLong")}</button>
              )}
            </div>
            )}

            {/* Date & Travelers */}
            {!isHotelOnlyMode && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {activeTab === "hotels" ? tt("hotelSearchThisTrip") : tt("tripDates")}
                </h3>
                <DateRangePicker
                  startDate={trip.startDate}
                  endDate={trip.endDate}
                  onSelect={(s, e) => updateTrip({ startDate: s, endDate: e })}
                  startLabel={t("depart")}
                  endLabel={t("return")}
                />
                <div className="mt-3">
                  <label className="text-xs text-gray-500 mb-1 block">{t("travelers")}</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={trip.travelers}
                      onChange={(e) =>
                        updateTrip({ travelers: Number(e.target.value) })
                      }
                      className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <option key={n} value={n}>
                          {n === 1 ? tt("travelerOne") : tt("travelerCount", { n })}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                {activeTab === "hotels" && (
                  <>
                    <div className="mt-3">
                      <label className="text-xs text-gray-500 mb-1 block">{tt("rooms")}</label>
                      <div className="relative">
                        <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          value={commonHotelRooms ?? ""}
                          disabled={hotelTabStops.length === 0}
                          onChange={(e) => {
                            const rooms = Number(e.target.value);
                            if (!rooms) return;
                            hotelTabStops.forEach((s) => updateStopField(s.id, { hotelRooms: rooms }));
                          }}
                          className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none disabled:opacity-60"
                        >
                          {commonHotelRooms === null && hotelTabStops.length > 0 && (
                            <option value="" disabled>{tt("roomsMixed")}</option>
                          )}
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <option key={n} value={n}>
                              {tt("roomCount", { n })}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-xs text-blue-800">
                      <MapPin className="w-4 h-4 flex-shrink-0 text-blue-500" />
                      <span>
                        {hotelTabStops.length === 0
                          ? tt("noOvernightYet")
                          : hotelTabStops.length === 1
                            ? tt("overnightCountOne")
                            : tt("overnightCountMany", { count: hotelTabStops.length })}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            

          </div>
          )}

          {/* Right Panel */}
          {activeTab !== "ortsinfo" && (
          <div className="min-w-0">
            {/* Route Tab (shared for auto, car, train) */}
            {(activeTab === "route" || activeTab === "car" || activeTab === "train") && (
              <div className="space-y-6">
                {showTips && !currentOrigin && !currentDestination && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">{tt("tip")}</p>
                        <p className="text-sm text-blue-600 mt-1">{tt("routeTip")}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                  <GoogleMap
                    key={activeTab}
                    stops={currentRouteStops}
                    viaPoints={currentRouteViaPoints}
                    travelMode={trip.travelMode}
                    optimize={optimizeRoute}
                    onRouteCalculated={(info) => {
                      setRouteInfo(info);
                      const routeKey = (activeTab === "route" || activeTab === "car" || activeTab === "train" || activeTab === "flights")
                        ? (activeTab as "route" | "car" | "train" | "flights")
                        : "route";
                      if (info.overviewPolyline && !hasUnsavedChanges) {
                        updateTripSilent((prev) => {
                          const prevPolyline = prev.routes?.[routeKey]?.overviewPolyline || "";
                          if (prevPolyline === info.overviewPolyline) return prev;
                          return {
                            ...prev,
                            routes: {
                              ...(prev.routes || {}),
                              [routeKey]: {
                                stops: prev.routes?.[routeKey]?.stops || (routeKey === "route" ? prev.stops : []),
                                viaPoints: prev.routes?.[routeKey]?.viaPoints || [],
                                overviewPolyline: info.overviewPolyline,
                              },
                            },
                          };
                        });
                      }
                      setRouteError(null);
                      setOptimizeRoute(false);
                    }}
                    onStopsReordered={handleStopsReordered}
                    onError={(msg) => { setRouteError(msg); setOptimizeRoute(false); }}
                    onMapClick={addStopFromMap}
                    onViaPointsChange={updateCurrentViaPoints}
                    onRemoveStop={removeStop}
                    bucketListPois={bucketListMapMarkers}
                    showBucketListOnMap={showBucketOnMap}
                    onToggleBucketListOnMap={() => setShowBucketOnMap((v) => !v)}
                    onAddToBucketList={addLandmarkPoiToBucket}
                    onAddBucketPoiAsStop={addBucketPoiAsStop}
                    isInBucketList={isInBucketList}
                    isInRoute={isInCurrentRoute}
                  />
                </div>

                {routeError && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">{tt("routing")}</p>
                        <p className="text-sm text-amber-600 mt-1">{routeError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                  {(() => {
                    const waypointCount = currentRouteStops.filter((s) => s.type === "stop" && s.name.trim()).length;
                    const tooMany = waypointCount >= 20;
                    const stats = [
                      { icon: Navigation, value: routeInfo?.distance || "—", active: !!routeInfo?.distance, label: tt("distance") },
                      { icon: Clock, value: routeInfo?.duration || "—", active: !!routeInfo?.duration, label: tt("driveTime") },
                      { icon: MapPin, value: routeInfo?.stops ?? "—", active: !!routeInfo, label: tt("viaStops") },
                    ];
                    return (
                      <>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                          {stats.map(({ icon: Icon, value, active, label }) => (
                            <div key={label} className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-blue-500" : "text-gray-300"}`} />
                              <div className="leading-tight">
                                <div className={`text-sm font-semibold ${active ? "text-gray-900" : "text-gray-300"}`}>
                                  {value}
                                </div>
                                <div className="text-[11px] text-gray-400">{label}</div>
                              </div>
                            </div>
                          ))}

                          {!tooMany && ((currentOrigin && currentDestination) || waypointCount >= 2) && (
                            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                              {currentOrigin && !tooMany && (
                                <button
                                  type="button"
                                  onClick={makeRoundTrip}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                                >
                                  <Route className="w-3.5 h-3.5" />{tt("roundTripShort")}</button>
                              )}
                              {currentOrigin && currentDestination && !tooMany && (
                                <button
                                  onClick={reverseRoute}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                                >
                                  <ArrowDownUp className="w-3.5 h-3.5" />{tt("reverseRoute")}</button>
                              )}

                              {waypointCount >= 2 && !tooMany && (
                                <button
                                  onClick={handleOptimizeRoute}
                                  disabled={optimizeRoute}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-50"
                                >
                                  {optimizeRoute ? (
                                    <>
                                      <div className="w-3.5 h-3.5 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />{tt("optimizing")}</>
                                  ) : (
                                    <>
                                      <Zap className="w-3.5 h-3.5" />{tt("shortestRoute")}</>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {currentOrigin && currentDestination && !routeInfo?.distance && !routeError && (
                          <p className="text-xs text-gray-400 mt-2">{tt("pickAutocomplete")}</p>
                        )}

                        {tooMany && (
                          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <p className="text-xs text-amber-700">
                              {tt("waypointsTooManyHint", { count: waypointCount })}
                              Verwende die Pfeile oder «+ Stopp auf Karte», um die Route anzupassen.
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Etappen Breakdown */}
                {etappen.length > 1 && (
                  <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <Route className="w-5 h-5 text-purple-500" />
                      <h3 className="font-semibold text-gray-900">
                        {tt("dayStages", { count: etappen.length })}
                      </h3>
                      {(() => {
                        const expandableCount = Math.min(
                          etappen.length - 1,
                          currentRouteStops.filter((s) => s.name.trim() && s.type === "stop" && !!s.isHotel).length
                        );
                        if (expandableCount < 1) return null;
                        const expandableIndices = Array.from({ length: expandableCount }, (_, i) => i);
                        const allExpanded = expandableIndices.every((i) => expandedEtappen.includes(i));
                        return (
                          <button
                            type="button"
                            onClick={() => setExpandedEtappen(allExpanded ? [] : expandableIndices)}
                            className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                          >
                            {allExpanded ? "Alle Etappen zuklappen" : "Alle Etappen aufklappen"}
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${allExpanded ? "rotate-180" : ""}`} />
                          </button>
                        );
                      })()}
                    </div>
                    <div>
                      {(() => {
                        const addDaysLocal = (dateStr: string, days: number) => {
                          const [y, m, d] = dateStr.split("-").map(Number);
                          const dt = new Date(y, m - 1, d + days);
                          return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
                        };
                        // Same date rules as the hotels tab, so stage dates match hotel check-in/out.
                        const departureDates: string[] = [trip.startDate || ""];
                        const dayOffsets: number[] = [0];
                        const hotelStays: { stop: RouteStop; checkIn: string; checkOut: string; nights: number }[] = [];
                        let dateCursor = trip.startDate || "";
                        currentRouteStops
                          .filter((s) => s.name.trim() && s.type === "stop" && !!s.isHotel)
                          .forEach((stop) => {
                            const nights = Math.max(1, Number(stop.hotelNights) || 2);
                            const isBookedAnchor = isBookedHotelStop(stop);
                            const checkIn = isBookedAnchor
                              ? stop.hotelCheckIn || ""
                              : dateCursor || stop.hotelCheckIn || "";
                            const checkOut = checkIn ? addDaysLocal(checkIn, nights) : "";
                            dateCursor = checkOut || dateCursor;
                            departureDates.push(checkOut);
                            dayOffsets.push(dayOffsets[dayOffsets.length - 1] + nights);
                            hotelStays.push({ stop, checkIn, checkOut, nights });
                          });
                        const shortDate = (dateStr: string) => {
                          const [y, m, d] = dateStr.split("-").map(Number);
                          return new Date(y, m - 1, d).toLocaleDateString("de-DE", { day: "numeric", month: "short" });
                        };
                        const stayRange = (checkIn: string, checkOut: string) => {
                          if (!checkIn || !checkOut) return "";
                          const sameMonth = checkIn.slice(0, 7) === checkOut.slice(0, 7);
                          const from = sameMonth ? `${Number(checkIn.slice(8, 10))}.` : shortDate(checkIn);
                          return `${from} → ${shortDate(checkOut)}`;
                        };
                        const dayInfo = (index: number) => {
                          const date = departureDates[index] || "";
                          let day = (dayOffsets[index] ?? index) + 1;
                          if (date && trip.startDate) {
                            const [y1, m1, d1] = trip.startDate.split("-").map(Number);
                            const [y2, m2, d2] = date.split("-").map(Number);
                            day = Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000) + 1;
                          }
                          const [y, m, d] = date ? date.split("-").map(Number) : [];
                          const dateLabel = date
                            ? new Date(y, m - 1, d).toLocaleDateString("de-DE", { day: "numeric", month: "short" })
                            : "";
                          return { day, dateLabel };
                        };

                        let carryHotelName = "";
                        let carryHotelAddress = "";
                        let carryHotelPlace = "";
                        let carryHotelNightsRemaining = 0;

                        const etappenWithCarry = etappen.map((etappe) => {
                          const hasDirectBooking = !!etappe.hotelBooked;
                          const bookingNights = hasDirectBooking ? Math.max(1, Number(etappe.hotelNights) || 2) : 0;
                          const inheritedBooking = !hasDirectBooking && carryHotelNightsRemaining > 0;

                          const hotelBookedForDisplay = hasDirectBooking || inheritedBooking;
                          const hotelNameForDisplay = hasDirectBooking
                            ? (etappe.hotelName || etappe.to)
                            : (carryHotelName || carryHotelPlace || etappe.to);
                          const hotelAddressForDisplay = hasDirectBooking
                            ? (etappe.hotelAddress || "")
                            : carryHotelAddress;
                          const hotelPlaceForDisplay = hasDirectBooking ? etappe.to : (carryHotelPlace || etappe.to);

                          if (hasDirectBooking) {
                            carryHotelName = etappe.hotelName || etappe.to;
                            carryHotelAddress = etappe.hotelAddress || "";
                            carryHotelPlace = etappe.to;
                            carryHotelNightsRemaining = Math.max(0, bookingNights - 1);
                          } else if (inheritedBooking) {
                            carryHotelNightsRemaining = Math.max(0, carryHotelNightsRemaining - 1);
                          } else {
                            carryHotelName = "";
                            carryHotelAddress = "";
                            carryHotelPlace = "";
                            carryHotelNightsRemaining = 0;
                          }

                          return {
                            ...etappe,
                            hotelBookedForDisplay,
                            hotelNameForDisplay,
                            hotelAddressForDisplay,
                            hotelPlaceForDisplay,
                          };
                        });

                        return etappenWithCarry.map((etappe) => {
                        const { day, dateLabel } = dayInfo(etappe.index);
                        const isLast = etappe.index === etappen.length - 1;
                        const stay = isLast ? undefined : hotelStays[etappe.index];
                        const isExpanded = !!stay && expandedEtappen.includes(etappe.index);
                        const rowContent = (
                          <>
                            <div className="sm:w-28 flex-shrink-0 text-sm leading-7">
                              <span className="font-semibold text-gray-900">Tag {day}</span>
                              {dateLabel && <span className="text-gray-400"> · {dateLabel}</span>}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm text-gray-800 truncate" title={`${etappe.from} → ${etappe.to}`}>
                                {etappe.from} → {etappe.to}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Navigation className="w-3 h-3 text-blue-500" />
                                <span>{etappe.distanceKm.toLocaleString("de-CH")} km</span>
                                <span className="text-gray-300">·</span>
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span>{etappe.durationFormatted}</span>
                              </div>
                            </div>
                            {!isLast && (
                              etappe.hotelBookedForDisplay ? (
                                <div
                                  className="self-start sm:self-auto inline-flex max-w-full sm:w-44 flex-shrink-0 items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-700"
                                  title={`Gebucht: ${[etappe.hotelNameForDisplay, etappe.hotelAddressForDisplay].filter(Boolean).join(" – ")}`}
                                >
                                  <BedDouble className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{etappe.hotelPlaceForDisplay}</span>
                                </div>
                              ) : (
                                <div
                                  className="self-start sm:self-auto inline-flex max-w-full sm:w-44 flex-shrink-0 items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs text-purple-600"
                                  title={`Übernachtung in ${etappe.hotelPlaceForDisplay}`}
                                >
                                  <BedDouble className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{etappe.hotelPlaceForDisplay}</span>
                                </div>
                              )
                            )}
                          </>
                        );
                        const stayHotelName = stay?.stop.bookingHotelName?.trim() || "";
                        const stayHasHotel =
                          !!stay &&
                          (!!stayHotelName ||
                            !!stay.stop.bookingConfirmation?.trim() ||
                            !!stay.stop.bookingHotelName?.trim());
                        const stayGuests = stay ? (stay.stop.hotelGuests || trip.travelers || 2) : 0;
                        return (
                        <div
                          key={etappe.index}
                          className="relative flex items-stretch gap-3"
                        >
                          <div className="flex flex-col items-center">
                            <div className={`w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                              etappe.index === 0
                                ? "bg-blue-500"
                                : etappe.index === etappen.length - 1
                                ? "bg-red-500"
                                : etappe.hotelBookedForDisplay
                                ? "bg-green-500"
                                : "bg-purple-500"
                            }`}>
                              {etappe.hotelBookedForDisplay ? <Check className="w-3.5 h-3.5" /> : etappe.index + 1}
                            </div>
                            {!isLast && (
                              <div className="w-0.5 flex-1 bg-gray-200 my-1" />
                            )}
                          </div>
                          <div className={`flex-1 min-w-0 ${isLast ? "" : "pb-3"}`}>
                            {stay ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedEtappen((prev) =>
                                    isExpanded ? prev.filter((i) => i !== etappe.index) : [...prev, etappe.index]
                                  )
                                }
                                aria-expanded={isExpanded}
                                className="relative w-full text-left flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4 rounded-lg -mx-2 px-2 pr-8 transition-colors hover:bg-gray-50"
                              >
                                {rowContent}
                                <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              </button>
                            ) : (
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                                {rowContent}
                              </div>
                            )}
                            {isExpanded && stay && (
                              <div className="mt-2 rounded-xl border border-purple-100 bg-purple-50/50 px-4 py-3">
                                <div className="text-sm font-semibold text-gray-900">Übernachtung in {stay.stop.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {[
                                    stayRange(stay.checkIn, stay.checkOut),
                                    `${stay.nights} ${stay.nights === 1 ? "Nacht" : "Nächte"}`,
                                    `${stayGuests} ${stayGuests === 1 ? "Person" : "Personen"}`,
                                  ].filter(Boolean).join(" · ")}
                                </div>
                                {stayHasHotel ? (
                                  <div className="mt-3 border-t border-purple-100 pt-3">
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                                      <BedDouble className="w-3.5 h-3.5 flex-shrink-0 text-purple-500" />
                                      <span className="truncate">{stayHotelName || `Unterkunft in ${stay.stop.name}`}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      {stay.nights} {stay.nights === 1 ? "Nacht" : "Nächte"} ·{" "}
                                      {stayHotelName || stay.stop.bookingConfirmation?.trim() ? "gebucht" : "vorgemerkt"}
                                    </div>
                                    {(stay.stop.bookingLink || hasHotelsTab) && (
                                      <div className="mt-2 flex items-center gap-2 text-xs font-medium">
                                        {stay.stop.bookingLink && (
                                          <a href={stay.stop.bookingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline">
                                            {partnerLinkCta(stay.stop.bookingLink, "open", locale)}
                                            <PartnerAffiliateMark href={stay.stop.bookingLink} />
                                          </a>
                                        )}
                                        {stay.stop.bookingLink && hasHotelsTab && <span className="text-gray-300">·</span>}
                                        {hasHotelsTab && (
                                          <button type="button" onClick={() => openHotelStop(stay.stop.id, true)} className="text-blue-600 hover:text-blue-800 hover:underline">
                                            {tt("changeBtn")}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="mt-3 border-t border-purple-100 pt-3">
                                    <div className="text-xs text-gray-500">{tt("noLodgingSelected")}</div>
                                    {hasHotelsTab && (
                                      <button
                                        type="button"
                                        onClick={() => openHotelStop(stay.stop.id, false)}
                                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900"
                                      >
                                        Hotel finden <ArrowRight className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        );
                      });
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hotels Tab */}
            {activeTab === "hotels" && (
              <div className="flex flex-col gap-6">
                <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${isHotelOnlyMode ? "" : "order-last"}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Hotel className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900">{tt("hotelsDirect")}</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <input
                      ref={hotelOnlyDestinationRef}
                      type="text"
                      value={hotelOnlyDestination}
                      onChange={(e) => setHotelOnlyDestination(e.target.value)}
                      placeholder={tt("hotelPlaceInput")}
                      className="lg:col-span-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="sm:col-span-2 lg:col-span-2">
                      <HotelDatePicker
                        checkIn={hotelOnlyCheckIn}
                        checkOut={hotelOnlyCheckOut}
                        nights={hotelOnlyNights}
                        onSelect={(ci, n) => {
                          const [y, m, d] = ci.split("-").map(Number);
                          const dt = new Date(y, m - 1, d + n);
                          const co = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
                          setHotelOnlyCheckIn(ci);
                          setHotelOnlyCheckOut(co);
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={hotelOnlyTravelers}
                        onChange={(e) => setHotelOnlyTravelers(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={tt("guests")}
                      />
                      <input
                        type="number"
                        min={1}
                        value={hotelOnlyRooms}
                        onChange={(e) => setHotelOnlyRooms(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={tt("rooms")}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <a
                      href={buildHotelsComLink(hotelOnlySearchParams)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        openHotelsComAffiliateLink(hotelOnlySearchParams, { mode: "hotel-only" });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                    >
                      <Hotel className="w-3.5 h-3.5" />
                      {partnerLabelFromUrl(buildHotelsComLink(hotelOnlySearchParams)).brandName}
                      <PartnerAffiliateMark href={buildHotelsComLink(hotelOnlySearchParams)} />
                    </a>
                    <a
                      href={buildExpediaHotelLink(hotelOnlySearchParams)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        openExpediaAffiliateLink(hotelOnlySearchParams, { mode: "hotel-only" });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors"
                    >
                      <Hotel className="w-3.5 h-3.5" />
                      {partnerLabelFromUrl(buildExpediaHotelLink(hotelOnlySearchParams)).brandName}
                      <PartnerAffiliateMark href={buildExpediaHotelLink(hotelOnlySearchParams)} />
                    </a>
                    <a
                      href={buildBookingHotelLink(hotelOnlySearchParams)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        const url = buildBookingHotelLink(hotelOnlySearchParams);
                        logAffiliateClick("hotels", partnerLabelFromUrl(url).brandName, url, { mode: "hotel-only" });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      <Hotel className="w-3.5 h-3.5" />
                      {partnerLabelFromUrl(buildBookingHotelLink(hotelOnlySearchParams)).brandName}
                      <PartnerAffiliateMark href={buildBookingHotelLink(hotelOnlySearchParams)} />
                    </a>
                  </div>
                </div>

                {(() => {
                  const allRouteStops = [
                    ...trip.stops,
                    ...(trip.routes?.flights?.stops || []),
                    ...(trip.routes?.car?.stops || []),
                    ...(trip.routes?.train?.stops || []),
                  ];
                  const seen = new Set<string>();
                  const deduped = allRouteStops.filter((s) => {
                    if ((s.type !== "stop" && s.type !== "end") || !s.name.trim()) return false;
                    const key = `${s.id}:${s.type}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  });
                  const hotelStops = deduped.filter((s) => s.isHotel);
                  const allStopsWithHotelOption = deduped;

                  function addDaysLocal(dateStr: string, days: number): string {
                    const [y, m, d] = dateStr.split("-").map(Number);
                    const dt = new Date(y, m - 1, d + days);
                    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
                  }

                  const computedHotelDates = computeHotelStaysTimeline(hotelStops, trip.startDate || "");

                  function getHotelDates(stop: RouteStop): { checkIn: string; checkOut: string; nights: number } {
                    if (isBookedHotelStop(stop)) {
                      return getBookedHotelDatesOnly(stop);
                    }
                    return (
                      computedHotelDates.get(stop.id) || {
                        checkIn: stop.hotelCheckIn || "",
                        checkOut: stop.hotelCheckIn
                          ? addDaysLocal(stop.hotelCheckIn, Math.max(1, Number(stop.hotelNights) || 2))
                          : "",
                        nights: Math.max(1, Number(stop.hotelNights) || 2),
                      }
                    );
                  }

                  function handleDateSelect(stopId: string, newCheckIn: string, newNights: number) {
                    const selected = hotelStops.find((s) => s.id === stopId);
                    if (selected && isBookedHotelStop(selected)) {
                      updateStopField(stopId, { hotelCheckIn: newCheckIn, hotelNights: newNights });
                    } else {
                      updateStopField(stopId, { hotelCheckIn: "", hotelNights: newNights });
                    }
                  }

                  if (allStopsWithHotelOption.length === 0) {
                    return (
                      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6">
                        <div className="flex items-start gap-3">
                          <BedDouble className="w-6 h-6 text-purple-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-purple-800">{tt("noHotelPlaces")}</p>
                            <p className="text-sm text-purple-600 mt-1">
                              Nutze {isHotelOnlyMode ? "oben" : "unten"} die direkte Hotelsuche oder markiere im <strong>{t("tabRoute")}</strong>{tt("noHotelPlacesBody2")}<BedDouble className="w-3.5 h-3.5 inline mx-1 text-purple-500" />{tt("noHotelPlacesBody3")}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <>
                      {hotelStops.length === 0 && (
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                          <div className="flex items-start gap-3">
                            <BedDouble className="w-5 h-5 text-amber-500 mt-0.5" />
                            <p className="text-sm text-amber-700">{tt("markHotelStops1")}<strong>{t("tabRoute")}</strong>{tt("markHotelStops2")}<BedDouble className="w-3.5 h-3.5 inline mx-1 text-purple-500" />{tt("markHotelStops3")}</p>
                          </div>
                        </div>
                      )}

                      {hotelStops.length > 0 && !trip.startDate && (
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                          <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
                            <p className="text-sm text-blue-700">{tt("setStartDate1")}<strong>{tt("tripStartDate")}</strong>{tt("setStartDate2")}</p>
                          </div>
                        </div>
                      )}

                      {hotelStops.length > 0 && (
                        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                          <div className="mb-4">
                            <div className="flex items-center gap-3">
                              <BedDouble className="w-5 h-5 text-purple-500" />
                              <h3 className="font-semibold text-gray-900">
                                Übernachtungen ({hotelStops.length})
                              </h3>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {tt("hotelsRouteIntro")}
                            </p>
                          </div>
                          <div className="space-y-3">
                            {hotelStops.map((stop, idx) => {
                              const { checkIn, checkOut, nights } = getHotelDates(stop);
                              const guests = stop.hotelGuests || trip.travelers || 2;
                              const rooms = stop.hotelRooms || 1;
                              const stopSearchParams = {
                                destination: stop.name,
                                checkIn,
                                checkOut,
                                travelers: guests,
                                rooms,
                              };
                              const panel = hotelPanels[stop.id];
                              const hotelName = stop.bookingHotelName?.trim() || "";
                              const isBooked = Boolean(hotelName || stop.bookingConfirmation?.trim());
                              const hasHotel = isBooked;
                              const dateLine = [
                                checkIn && checkOut ? `${formatDate(checkIn)} – ${formatDate(checkOut)}` : "",
                                `${nights} ${nights === 1 ? "Nacht" : "Nächte"}`,
                              ].filter(Boolean).join(" · ");
                              return (
                                <div
                                  key={stop.id}
                                  id={`hotel-stop-${stop.id}`}
                                  className={`rounded-xl border border-gray-100 bg-white p-4 sm:p-5 scroll-mt-24 transition-shadow ${
                                    hotelFocus?.stopId === stop.id ? "ring-2 ring-purple-400 ring-offset-2" : ""
                                  }`}
                                >
                                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                                    <div className="flex min-w-0 flex-1 gap-3">
                                      <div className={`w-8 h-8 flex-shrink-0 ${isBooked ? "bg-green-500" : stop.type === "end" ? "bg-red-500" : "bg-purple-500"} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                                        {isBooked ? <Check className="w-4 h-4" /> : idx + 1}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <h4 className="font-semibold text-gray-900 truncate">{stop.name}</h4>
                                        <div className="mt-1.5 max-w-xs" title={dateLine}>
                                          <HotelDatePicker
                                            checkIn={checkIn}
                                            checkOut={checkOut}
                                            nights={nights}
                                            locked={isBooked}
                                            onSelect={(ci, n) => handleDateSelect(stop.id, ci, n)}
                                          />
                                          {isBooked && (
                                            <p className="mt-1 text-[10px] text-green-700 leading-snug">
                                              {tt("bookedDatesLocked")}
                                            </p>
                                          )}
                                        </div>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                                          <label className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1">
                                            <Users className="w-3.5 h-3.5 text-gray-400" />
                                            <select
                                              aria-label={`Gäste in ${stop.name}`}
                                              value={guests}
                                              onChange={(e) => updateStopField(stop.id, { hotelGuests: parseInt(e.target.value) || 1 })}
                                              className="cursor-pointer bg-transparent text-xs font-medium text-gray-900 focus:outline-none"
                                            >
                                              {Array.from(new Set([...Array.from({ length: 10 }, (_, i) => i + 1), guests])).sort((a, b) => a - b).map((n) => (
                                                <option key={n} value={n}>{n} {n === 1 ? "Gast" : "Gäste"}</option>
                                              ))}
                                            </select>
                                          </label>
                                          <label className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1">
                                            <BedDouble className="w-3.5 h-3.5 text-gray-400" />
                                            <select
                                              aria-label={`Zimmer in ${stop.name}`}
                                              value={rooms}
                                              onChange={(e) => updateStopField(stop.id, { hotelRooms: parseInt(e.target.value) || 1 })}
                                              className="cursor-pointer bg-transparent text-xs font-medium text-gray-900 focus:outline-none"
                                            >
                                              {Array.from(new Set([...Array.from({ length: 6 }, (_, i) => i + 1), rooms])).sort((a, b) => a - b).map((n) => (
                                                <option key={n} value={n}>{n} Zimmer</option>
                                              ))}
                                            </select>
                                          </label>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                          <button
                                            type="button"
                                            onClick={() => toggleHotelPanel(stop.id, "search")}
                                            aria-expanded={panel === "search"}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                                          >
                                            <Search className="w-3.5 h-3.5" />
                                            Hotel suchen
                                            <ArrowRight className={`w-3.5 h-3.5 transition-transform ${panel === "search" ? "rotate-90" : ""}`} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => toggleHotelPanel(stop.id, "booking")}
                                            aria-expanded={panel === "booking"}
                                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${
                                              panel === "booking"
                                                ? "border-blue-300 bg-blue-50 text-blue-700"
                                                : "border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
                                            }`}
                                          >
                                            <Calendar className="w-3.5 h-3.5" />{tt("enterBooking")}</button>
                                        </div>
                                      </div>
                                    </div>
                                    <div className={`flex items-start gap-3 rounded-xl px-4 py-3 md:w-72 md:flex-shrink-0 ${hasHotel ? (isBooked ? "bg-green-50" : "bg-purple-50/60") : "bg-gray-50"}`}>
                                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${isBooked ? "bg-green-100 text-green-600" : "bg-purple-100 text-purple-500"}`}>
                                        {isBooked ? <Check className="w-4 h-4" /> : <BedDouble className="w-4 h-4" />}
                                      </div>
                                      <div className="min-w-0 text-xs">
                                        {hasHotel ? (
                                          <>
                                            <p className="font-semibold text-gray-900 truncate">{hotelName || `Unterkunft in ${stop.name}`}</p>
                                            <p className={`mt-0.5 ${isBooked ? "text-green-700" : "text-purple-600"}`}>
                                              {isBooked ? "Gebucht" : "Vorgemerkt"}
                                              {stop.bookingPrice ? ` · ${stop.bookingPrice}` : ""}
                                            </p>
                                            {stop.bookingAddress && <p className="mt-0.5 text-gray-500 truncate">{stop.bookingAddress}</p>}
                                            {stop.bookingLink && (
                                              <a href={stop.bookingLink} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800">
                                                {partnerLinkCta(stop.bookingLink, "open", locale)}
                                                <PartnerAffiliateMark href={stop.bookingLink} />
                                                <ExternalLink className="w-3 h-3" />
                                              </a>
                                            )}
                                          </>
                                        ) : (
                                          <>
                                            <p className="font-semibold text-gray-900">{tt("noHotelSelected")}</p>
                                            <p className="mt-0.5 text-gray-500">
                                              {stop.type === "end"
                                                ? `Optionale Übernachtung in ${stop.name} oder trage eine bestehende Buchung ein.`
                                                : `Finde das passende Hotel in ${stop.name} oder trage eine bestehende Buchung ein.`}
                                            </p>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {panel === "search" && (
                                  <div className="mt-4 border-t border-gray-100 pt-4">
                                  <div className="flex flex-wrap gap-2">
                                    <a
                                      href={buildHotelsComLink(stopSearchParams)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        openHotelsComAffiliateLink(stopSearchParams, {
                                          stopId: stop.id,
                                          stopName: stop.name,
                                        });
                                      }}
                                      className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-white px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                                    >
                                      <Hotel className="w-3.5 h-3.5" />
                                      {partnerLabelFromUrl(buildHotelsComLink(stopSearchParams)).brandName}
                                      <PartnerAffiliateMark href={buildHotelsComLink(stopSearchParams)} />
                                      <ExternalLink className="w-3 h-3 text-red-400" />
                                    </a>
                                    <a
                                      href={buildBookingHotelLink(stopSearchParams)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() => {
                                        const url = buildBookingHotelLink(stopSearchParams);
                                        logAffiliateClick("hotels", partnerLabelFromUrl(url).brandName, url, {
                                          stopId: stop.id,
                                          stopName: stop.name,
                                        });
                                      }}
                                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-white px-3 py-2 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                                    >
                                      <Hotel className="w-3.5 h-3.5" />
                                      {partnerLabelFromUrl(buildBookingHotelLink(stopSearchParams)).brandName}
                                      <PartnerAffiliateMark href={buildBookingHotelLink(stopSearchParams)} />
                                      <ExternalLink className="w-3 h-3 text-blue-400" />
                                    </a>
                                    <a
                                      href={buildExpediaHotelLink(stopSearchParams)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        openExpediaAffiliateLink(stopSearchParams, {
                                          stopId: stop.id,
                                          stopName: stop.name,
                                        });
                                      }}
                                      className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-white px-3 py-2 rounded-lg border border-yellow-200 hover:bg-yellow-50 transition-colors"
                                    >
                                      <Hotel className="w-3.5 h-3.5" />
                                      {partnerLabelFromUrl(buildExpediaHotelLink(stopSearchParams)).brandName}
                                      <PartnerAffiliateMark href={buildExpediaHotelLink(stopSearchParams)} />
                                      <ExternalLink className="w-3 h-3 text-yellow-400" />
                                    </a>
                                    <a
                                      href={buildAgodaHotelLink(stopSearchParams)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() => {
                                        const url = buildAgodaHotelLink(stopSearchParams);
                                        logAffiliateClick("hotels", partnerLabelFromUrl(url).brandName, url, {
                                          stopId: stop.id,
                                          stopName: stop.name,
                                        });
                                      }}
                                      className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 bg-white px-3 py-2 rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors"
                                    >
                                      <Hotel className="w-3.5 h-3.5" />
                                      {partnerLabelFromUrl(buildAgodaHotelLink(stopSearchParams)).brandName}
                                      <PartnerAffiliateMark href={buildAgodaHotelLink(stopSearchParams)} />
                                      <ExternalLink className="w-3 h-3 text-purple-400" />
                                    </a>
                                    <a
                                      href={buildTrivagoLink(stopSearchParams)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() => {
                                        const url = buildTrivagoLink(stopSearchParams);
                                        logAffiliateClick("hotels", partnerLabelFromUrl(url).brandName, url, {
                                          stopId: stop.id,
                                          stopName: stop.name,
                                        });
                                      }}
                                      className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-white px-3 py-2 rounded-lg border border-teal-200 hover:bg-teal-50 transition-colors"
                                    >
                                      <Search className="w-3.5 h-3.5" />
                                      {partnerLabelFromUrl(buildTrivagoLink(stopSearchParams)).brandName}
                                      <ExternalLink className="w-3 h-3 text-teal-400" />
                                    </a>
                                  </div>
                                  </div>
                                  )}

                                  {panel === "booking" && (
                                    <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
                                      <button
                                        type="button"
                                        onClick={() => openIcsBookingImport(stop.id)}
                                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-green-300 bg-green-50/80 px-3 py-2 text-xs font-medium text-green-800 hover:bg-green-100 transition-colors"
                                      >
                                        <FileUp className="h-3.5 w-3.5 shrink-0" />
                                        {tt("importIcsBooking")}
                                      </button>
                                      {icsImportFeedback[stop.id] === "ok" && (
                                        <p className="text-[11px] text-green-700 leading-snug">{tt("importIcsSuccess")}</p>
                                      )}
                                      {icsImportFeedback[stop.id] === "err" && (
                                        <p className="text-[11px] text-red-600 leading-snug">{tt("importIcsError")}</p>
                                      )}
                                      <input
                                        type="text"
                                        placeholder={tt("hotelName")}
                                        value={stop.bookingHotelName || ""}
                                        onChange={(e) => updateStopField(stop.id, { bookingHotelName: e.target.value })}
                                        className="w-full px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-300 focus:border-transparent"
                                      />
                                      <input
                                        type="text"
                                        placeholder={tt("address")}
                                        value={stop.bookingAddress || ""}
                                        onChange={(e) => updateStopField(stop.id, { bookingAddress: e.target.value })}
                                        className="w-full px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-300 focus:border-transparent"
                                      />
                                      <div className="grid grid-cols-2 gap-2">
                                        <input
                                          type="text"
                                          placeholder={tt("bookingNo")}
                                          value={stop.bookingConfirmation || ""}
                                          onChange={(e) => updateStopField(stop.id, { bookingConfirmation: e.target.value })}
                                          className="px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-300 focus:border-transparent"
                                        />
                                        <input
                                          type="text"
                                          placeholder={tt("pricePh")}
                                          value={stop.bookingPrice || ""}
                                          onChange={(e) => updateStopField(stop.id, { bookingPrice: e.target.value })}
                                          className="px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-300 focus:border-transparent"
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <input
                                          type="text"
                                          placeholder={tt("bookingLinkPh")}
                                          value={stop.bookingLink || ""}
                                          onChange={(e) => updateStopField(stop.id, { bookingLink: e.target.value })}
                                          className="px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-300 focus:border-transparent"
                                        />
                                        <select
                                          value={stop.bookingProvider || ""}
                                          onChange={(e) => updateStopField(stop.id, { bookingProvider: e.target.value })}
                                          className="px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-300 focus:border-transparent"
                                        >
                                          <option value="">{tt("provider")}</option>
                                          <option value="Hotels.com">Hotels.com</option>
                                          <option value="Booking.com">Booking.com</option>
                                          <option value="Expedia">Expedia</option>
                                          <option value="Agoda">Agoda</option>
                                          <option value="trivago">trivago</option>
                                          <option value="Andere">{tt("other")}</option>
                                        </select>
                                      </div>
                                      {stop.bookingConfirmation && (
                                        <button
                                          type="button"
                                          onClick={() => updateStopField(stop.id, { bookingHotelName: "", bookingAddress: "", bookingConfirmation: "", bookingPrice: "", bookingLink: "", bookingProvider: "" })}
                                          className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                                        >{tt("deleteBooking")}</button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Quick-add hotel stops */}
                      {allStopsWithHotelOption.filter((s) => !s.isHotel).length > 0 && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{tt("moreHotelStops")}</h4>
                          <div className="space-y-2">
                            {allStopsWithHotelOption
                              .filter((s) => !s.isHotel)
                              .map((stop) => (
                                <button
                                  key={stop.id}
                                  onClick={() => toggleHotel(stop.id)}
                                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-purple-50 rounded-xl transition-colors text-left group"
                                >
                                  {stop.type === "end" ? (
                                    <Flag className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
                                  ) : (
                                    <MapPin className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
                                  )}
                                  <span className="text-sm text-gray-700 group-hover:text-purple-700 font-medium">
                                    {stop.name} {stop.type === "end" ? "(Ziel)" : ""}
                                  </span>
                                  <BedDouble className="w-4 h-4 text-gray-300 group-hover:text-purple-500 ml-auto" />
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Reisebericht Tab */}
            {activeTab === "report" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                    <div>
                      <h3 className="font-semibold text-gray-900">{t("tabReport")}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {tt("reportPdfIntro")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDownloadPDF()}
                      disabled={pdfGenerating}
                      className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-4 py-2 text-sm font-medium text-white hover:bg-[#0077ed] disabled:opacity-50"
                    >
                      {pdfGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                      {tt("pdfCreate")}
                    </button>
                  </div>

                  {pdfExportError && (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      {pdfExportError}
                    </div>
                  )}

                  <div className="mb-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      {tt("pdfContentsHeading")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                      {applicablePdfExportDefs.length === 0 ? (
                        <p className="col-span-full text-sm text-gray-500 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
                          {tt("pdfNoOptionalSections")}
                        </p>
                      ) : null}
                      {applicablePdfExportDefs.map((def) => (
                        <label
                          key={def.key}
                          className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50 p-3 cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isPdfExportOptionEnabled(trip, def.key, pdfExportContext)}
                            onChange={(ev) => updateTrip({ [def.tripField]: ev.target.checked })}
                            className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-gray-900">
                              {tt(def.labelKey as Parameters<typeof tt>[0])}
                            </span>
                            <span className="block text-[11px] text-gray-500 leading-snug mt-0.5">
                              {tt(def.descKey as Parameters<typeof tt>[0])}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-start gap-4">
                    <div className="flex h-[236px] flex-col items-start justify-between">
                      {trip.pdfCoverPhotoDataUrl ? (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowCoverPreviewModal(true)}
                            className="relative w-[132px] aspect-[1/1.414] rounded-lg overflow-hidden border border-gray-200 bg-gray-50 hover:ring-2 hover:ring-indigo-300 transition-all cursor-zoom-in"
                            title={tt("coverEnlarge")}
                          >
                            <MediaImg src={trip.pdfCoverPhotoDataUrl} alt="Titelbild Vorschau" className="w-full h-full object-cover" />
                          </button>
                          <button
                            type="button"
                            onClick={clearPdfCoverPhoto}
                            className="absolute -top-2 -right-2 z-20 w-6 h-6 rounded-full bg-white border border-gray-300 shadow-sm text-gray-600 hover:text-red-600 hover:border-red-300 flex items-center justify-center"
                            title={tt("removeCover")}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-[132px] aspect-[1/1.414] rounded-lg border border-dashed border-gray-300 bg-gray-50" />
                      )}
                      <label className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer">
                        <FolderOpen className="w-4 h-4" />{tt("loadCover")}<input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(ev) => {
                            void setPdfCoverPhoto(ev.target.files);
                            ev.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap items-start gap-3">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setPdfCoverStyle("background")}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter" || ev.key === " ") {
                            ev.preventDefault();
                            setPdfCoverStyle("background");
                          }
                        }}
                        className={`relative h-[236px] rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                          (trip.pdfCoverPhotoStyle || "belowTitle") === "background"
                            ? "border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50"
                            : "border-gray-200 bg-white hover:border-indigo-300"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setShowCoverVariantModal("background");
                          }}
                          className="absolute right-2 top-2 z-20 w-6 h-6 rounded-full bg-white/95 border border-gray-300 text-gray-600 hover:text-indigo-700 flex items-center justify-center"
                          title={tt("enlargeVariant")}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <div className="relative mx-auto w-[112px] aspect-[1/1.414] overflow-hidden rounded-lg bg-slate-200 border border-gray-200">
                          {previewModeFor("background") === "background" ? (
                            <>
                              {trip.pdfCoverPhotoDataUrl ? (
                                <MediaImg src={trip.pdfCoverPhotoDataUrl} alt="Vorschau Hintergrund" className="absolute inset-0 w-full h-full object-fill" />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-700/70 to-emerald-700/50" />
                              )}
                              <div className="absolute inset-0 bg-black/20" />
                            </>
                          ) : (
                            <>
                              <div className="absolute inset-0 bg-white" />
                              {trip.pdfCoverPhotoDataUrl ? (
                                <div className="absolute inset-x-0 bottom-0 h-[68%] bg-white">
                                  <MediaImg src={trip.pdfCoverPhotoDataUrl} alt="Vorschau unter Titel" className="w-full h-full object-contain" />
                                </div>
                              ) : (
                                <div className="absolute inset-x-0 bottom-0 h-[68%] bg-slate-300" />
                              )}
                            </>
                          )}
                          <div className="absolute inset-x-2 top-2">
                            <div
                              className="truncate font-semibold"
                              style={{
                                color: coverTitleColor,
                                fontFamily: coverFontFamily(coverTitleFont),
                                fontSize: `${coverMiniTitleSize}px`,
                                lineHeight: 1.1,
                                textAlign: coverTitleAlign,
                                textShadow: "0 1px 2px rgba(0,0,0,0.45)",
                              }}
                            >
                              {trip.name || "Titel auf Bild"}
                            </div>
                            {(trip.startDate && trip.endDate) && (
                              <div
                                className="mt-1 truncate"
                                style={{
                                  color: coverDateColor,
                                  fontFamily: coverFontFamily(coverDateFont),
                                  fontSize: `${coverMiniDateSize}px`,
                                  lineHeight: 1.1,
                                  textAlign: coverDateAlign,
                                  textShadow: "0 1px 2px rgba(0,0,0,0.45)",
                                }}
                              >
                                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="mt-1.5 text-[11px] font-semibold text-gray-800">{tt("coverBg")}</p>
                        {trip.pdfCoverPhotoDataUrl && !coverIsPortrait && (
                          <p className="text-[10px] text-amber-600">{tt("coverLandscape")}</p>
                        )}
                      </div>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setPdfCoverStyle("belowTitle")}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter" || ev.key === " ") {
                            ev.preventDefault();
                            setPdfCoverStyle("belowTitle");
                          }
                        }}
                        className={`relative h-[236px] rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                          (trip.pdfCoverPhotoStyle || "belowTitle") === "belowTitle"
                            ? "border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50"
                            : "border-gray-200 bg-white hover:border-indigo-300"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setShowCoverVariantModal("belowTitle");
                          }}
                          className="absolute right-2 top-2 z-20 w-6 h-6 rounded-full bg-white/95 border border-gray-300 text-gray-600 hover:text-indigo-700 flex items-center justify-center"
                          title={tt("enlargeVariant")}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <div className="relative mx-auto w-[112px] aspect-[1/1.414] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                          <div className="absolute inset-x-2 top-2 z-10">
                            <div className="truncate font-semibold" style={{ color: coverTitleColor, fontFamily: coverFontFamily(coverTitleFont), fontSize: `${coverMiniTitleSize}px`, lineHeight: 1.1, textAlign: coverTitleAlign }}>
                              {trip.name || "Titel"}
                            </div>
                            {(trip.startDate && trip.endDate) && (
                              <div className="mt-1 truncate" style={{ color: coverDateColor, fontFamily: coverFontFamily(coverDateFont), fontSize: `${coverMiniDateSize}px`, lineHeight: 1.1, textAlign: coverDateAlign }}>
                                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                              </div>
                            )}
                          </div>
                          {trip.pdfCoverPhotoDataUrl ? (
                            <div className="absolute inset-x-0 bottom-0 h-[68%] bg-white">
                              <MediaImg src={trip.pdfCoverPhotoDataUrl} alt="Vorschau unter Titel" className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <div className="absolute inset-x-0 bottom-0 h-[68%] bg-slate-300" />
                          )}
                        </div>
                        <p className="mt-1.5 text-[11px] font-semibold text-gray-800">{tt("coverBelow")}</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-3 min-w-[240px]">
                      <p className="text-[11px] font-semibold text-gray-700 mb-2">{tt("title")}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <select
                          value={coverTitleFont}
                          onChange={(ev) => updateTrip({ pdfCoverTitleFont: ev.target.value as "helvetica" | "times" | "courier" })}
                          className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700"
                        >
                          <option value="helvetica">Helvetica</option>
                          <option value="times">Times</option>
                          <option value="courier">Courier</option>
                        </select>
                        <select
                          value={coverTitleSize}
                          onChange={(ev) => updateTrip({ pdfCoverTitleSize: Number(ev.target.value) || 32 })}
                          className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700"
                        >
                          {[22, 26, 30, 32, 36, 40, 44, 48].map((n) => (
                            <option key={`title-size-${n}`} value={n}>{n}px</option>
                          ))}
                        </select>
                        <input
                          type="color"
                          value={coverTitleColor}
                          onChange={(ev) => updateTrip({ pdfCoverTitleColor: ev.target.value })}
                          className="w-10 h-9 rounded border border-gray-200 bg-white cursor-pointer"
                          title={tt("titleColor")}
                        />
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[
                          { id: "left", icon: AlignLeft, title: "Titel linksbündig" },
                          { id: "center", icon: AlignCenter, title: "Titel zentriert" },
                          { id: "right", icon: AlignRight, title: "Titel rechtsbündig" },
                        ].map((opt) => {
                          const Icon = opt.icon;
                          const isActive = coverTitleAlign === opt.id;
                          return (
                            <button
                              key={`title-align-${opt.id}`}
                              type="button"
                              onClick={() => updateTrip({ pdfCoverTitleAlign: opt.id as "left" | "center" | "right" })}
                              className={`w-9 h-9 rounded-md border flex items-center justify-center transition-colors ${
                                isActive
                                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                  : "border-gray-200 bg-white text-gray-600 hover:text-indigo-700 hover:border-indigo-300"
                              }`}
                              title={opt.title}
                              aria-label={opt.title}
                            >
                              <Icon className="w-4 h-4" />
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] font-semibold text-gray-700 mb-2 mt-2">{tt("date")}</p>
                      <div className="flex items-center gap-2">
                        <select
                          value={coverDateFont}
                          onChange={(ev) => updateTrip({ pdfCoverDateFont: ev.target.value as "helvetica" | "times" | "courier" })}
                          className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700"
                        >
                          <option value="helvetica">Helvetica</option>
                          <option value="times">Times</option>
                          <option value="courier">Courier</option>
                        </select>
                        <select
                          value={coverDateSize}
                          onChange={(ev) => updateTrip({ pdfCoverDateSize: Number(ev.target.value) || 14 })}
                          className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700"
                        >
                          {[10, 12, 14, 16, 18, 20, 22, 24].map((n) => (
                            <option key={`date-size-${n}`} value={n}>{n}px</option>
                          ))}
                        </select>
                        <input
                          type="color"
                          value={coverDateColor}
                          onChange={(ev) => updateTrip({ pdfCoverDateColor: ev.target.value })}
                          className="w-10 h-9 rounded border border-gray-200 bg-white cursor-pointer"
                          title={tt("dateColor")}
                        />
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        {[
                          { id: "left", icon: AlignLeft, title: "Datum linksbündig" },
                          { id: "center", icon: AlignCenter, title: "Datum zentriert" },
                          { id: "right", icon: AlignRight, title: "Datum rechtsbündig" },
                        ].map((opt) => {
                          const Icon = opt.icon;
                          const isActive = coverDateAlign === opt.id;
                          return (
                            <button
                              key={`date-align-${opt.id}`}
                              type="button"
                              onClick={() => updateTrip({ pdfCoverDateAlign: opt.id as "left" | "center" | "right" })}
                              className={`w-9 h-9 rounded-md border flex items-center justify-center transition-colors ${
                                isActive
                                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                  : "border-gray-200 bg-white text-gray-600 hover:text-indigo-700 hover:border-indigo-300"
                              }`}
                              title={opt.title}
                              aria-label={opt.title}
                            >
                              <Icon className="w-4 h-4" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                </div>
                {showCoverPreviewModal && trip.pdfCoverPhotoDataUrl && (
                  <div
                    className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowCoverPreviewModal(false)}
                  >
                    <div
                      className="relative w-full max-w-md"
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setShowCoverPreviewModal(false)}
                        className="absolute -top-3 -right-3 z-30 w-8 h-8 rounded-full bg-white text-gray-700 shadow-lg flex items-center justify-center"
                        title={tt("closeAlt")}
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="relative z-10 rounded-xl overflow-hidden bg-gray-900 shadow-2xl">
                        <MediaImg
                          src={trip.pdfCoverPhotoDataUrl}
                          variant="full"
                          alt="Titelbild Großansicht"
                          className="w-full h-[72vh] object-contain bg-black"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute inset-x-6 top-10">
                          <p className="font-bold" style={{ color: coverTitleColor, fontFamily: coverFontFamily(coverTitleFont), fontSize: `${coverTitleSize}px`, textAlign: coverTitleAlign }}>
                            {trip.name || "Neue Reise"}
                          </p>
                          {(trip.startDate && trip.endDate) && (
                            <p className="mt-4" style={{ color: coverDateColor, fontFamily: coverFontFamily(coverDateFont), fontSize: `${coverDateSize}px`, textAlign: coverDateAlign }}>
                              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {showCoverVariantModal && (
                  <div
                    className="fixed inset-0 z-[121] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowCoverVariantModal(null)}
                  >
                    <div
                      className="relative w-full max-w-lg"
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setShowCoverVariantModal(null)}
                        className="absolute -top-3 -right-3 z-30 w-8 h-8 rounded-full bg-white text-gray-700 shadow-lg flex items-center justify-center"
                        title={tt("closeAlt")}
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="relative z-10 rounded-xl overflow-hidden bg-gray-900 shadow-2xl p-4">
                        <div className="relative mx-auto w-full max-w-[380px] aspect-[1/1.414] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                          {showCoverVariantModal === "background" ? (
                            <>
                              {previewModeFor("background") === "background" ? (
                                <>
                                  {trip.pdfCoverPhotoDataUrl ? (
                                    <MediaImg src={trip.pdfCoverPhotoDataUrl} alt="Variante Hintergrund" className="absolute inset-0 w-full h-full object-fill" />
                                  ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-700/70 to-emerald-700/50" />
                                  )}
                                  <div className="absolute inset-0 bg-black/20" />
                                </>
                              ) : (
                                <>
                                  <div className="absolute inset-0 bg-white" />
                                  {trip.pdfCoverPhotoDataUrl ? (
                                    <div className="absolute inset-x-0 bottom-0 h-[68%] bg-white">
                                      <MediaImg src={trip.pdfCoverPhotoDataUrl} alt="Variante unter Titel" className="w-full h-full object-contain" />
                                    </div>
                                  ) : (
                                    <div className="absolute inset-x-0 bottom-0 h-[68%] bg-slate-300" />
                                  )}
                                </>
                              )}
                              <div
                                className="absolute inset-x-4 top-4 truncate font-semibold"
                                style={{
                                  color: coverTitleColor,
                                  fontFamily: coverFontFamily(coverTitleFont),
                                  fontSize: `${Math.max(12, coverTitleSize * 0.45)}px`,
                                  textAlign: coverTitleAlign,
                                  textShadow: "0 1px 2px rgba(0,0,0,0.45)",
                                }}
                              >
                                {trip.name || "Titel auf Bild"}
                              </div>
                              {(trip.startDate && trip.endDate) && (
                                <div
                                  className="absolute inset-x-4 top-12"
                                  style={{
                                    color: coverDateColor,
                                    fontFamily: coverFontFamily(coverDateFont),
                                    fontSize: `${Math.max(10, coverDateSize * 0.6)}px`,
                                    textAlign: coverDateAlign,
                                    textShadow: "0 1px 2px rgba(0,0,0,0.45)",
                                  }}
                                >
                                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="absolute inset-x-4 top-4 z-10 truncate font-semibold" style={{ color: coverTitleColor, fontFamily: coverFontFamily(coverTitleFont), fontSize: `${Math.max(12, coverTitleSize * 0.45)}px`, textAlign: coverTitleAlign }}>
                                {trip.name || "Titel"}
                              </div>
                              {(trip.startDate && trip.endDate) && (
                                <div className="absolute inset-x-4 top-12 z-10" style={{ color: coverDateColor, fontFamily: coverFontFamily(coverDateFont), fontSize: `${Math.max(10, coverDateSize * 0.6)}px`, textAlign: coverDateAlign }}>
                                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                                </div>
                              )}
                              {trip.pdfCoverPhotoDataUrl ? (
                                <div className="absolute inset-x-0 bottom-0 h-[68%] bg-white">
                                  <MediaImg src={trip.pdfCoverPhotoDataUrl} alt="Variante unter Titel" className="w-full h-full object-contain" />
                                </div>
                              ) : (
                                <div className="absolute inset-x-0 bottom-0 h-[68%] bg-slate-300" />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {etappen.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-sm text-gray-500">
                    {tt("photosLayoutEmpty")}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {etappen.map((etappe, eIdx) => {
                      const selectedPdfPhotos = getSelectedPdfPhotosForEtappe(eIdx);
                      const pdfPhotoLibrary = getPdfPhotoLibraryForEtappe(eIdx);
                      const pdfPhotoPlacement = trip.pdfPhotoPlacementByEtappe?.[String(eIdx)] || "afterEntdecken";
                      const pdfPhotoLayout = trip.pdfPhotoLayoutByEtappe?.[String(eIdx)] || "auto";
                      const pdfPhotoPages = trip.pdfPhotoPagesByEtappe?.[String(eIdx)] || 1;
                      return (
                        <div key={`report-${eIdx}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                Etappe {eIdx + 1}: {etappe.from} → {etappe.to}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {etappe.distanceKm.toLocaleString("de-CH")} km · {etappe.durationFormatted}
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                              {selectedPdfPhotos.length} ausgewählt
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <select
                              value={pdfPhotoPlacement}
                              onChange={(ev) => setPdfPhotoPlacementForEtappe(eIdx, ev.target.value as PdfPhotoPlacement)}
                              className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700"
                            >
                              <option value="afterHotel">{tt("afterHotel")}</option>
                              <option value="afterTeilstrecken">{tt("afterLegs")}</option>
                              <option value="afterEntdecken">{tt("afterDiscover")}</option>
                            </select>
                            <select
                              value={pdfPhotoLayout}
                              onChange={(ev) => setPdfPhotoLayoutForEtappe(eIdx, ev.target.value as PdfPhotoLayout)}
                              className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700"
                            >
                              <option value="auto">{tt("autoLayout")}</option>
                              <option value="onePerPageMax">{tt("layout1full")}</option>
                              <option value="onePortraitTopHalf">{tt("layout1top")}</option>
                              <option value="onePortraitBottomHalf">{tt("layout1bottom")}</option>
                              <option value="twoPortraitSideBySide">{tt("layout2side")}</option>
                              <option value="twoPortraitStacked">{tt("layout2stack")}</option>
                              <option value="twoMixedStacked">{tt("layoutMixed")}</option>
                              <option value="sixPortraitGrid">{tt("layout6")}</option>
                              <option value="threePortraitOneLandscape">{tt("layout3plus1")}</option>
                              <option value="grid">{tt("grid")}</option>
                              <option value="smartPages">{tt("smartPages")}</option>
                            </select>
                            <input
                              type="number"
                              min={1}
                              max={12}
                              value={pdfPhotoPages}
                              onChange={(ev) => setPdfPhotoPagesForEtappe(eIdx, Math.max(1, Math.min(12, Number(ev.target.value) || 1)))}
                              className="w-20 text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700"
                            />
                            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer">
                              <FolderOpen className="w-3.5 h-3.5" />{tt("selectPhotos")}<input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(ev) => {
                                  void addPickedPdfPhotosToEtappe(eIdx, ev.target.files);
                                  ev.currentTarget.value = "";
                                }}
                              />
                            </label>
                          </div>

                          {selectedPdfPhotos.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                {tt("pdfPhotoCaption")}
                              </p>
                              {selectedPdfPhotos.map((url, capIdx) => (
                                <div key={`cap-${eIdx}-${capIdx}`} className="flex items-center gap-2">
                                  <img
                                    src={url}
                                    alt=""
                                    className="h-10 w-10 shrink-0 rounded-md object-cover border border-gray-200"
                                  />
                                  <input
                                    type="text"
                                    value={trip.pdfPhotoCaptionsByEtappe?.[String(eIdx)]?.[url] || ""}
                                    maxLength={PDF_PHOTO_CAPTION_MAX_LENGTH}
                                    onChange={(ev) =>
                                      setPdfPhotoCaptionForEtappe(eIdx, url, ev.target.value)
                                    }
                                    placeholder={tt("pdfPhotoCaptionPh")}
                                    className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-800"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {(selectedPdfPhotos.length > 0 || pdfPhotoLibrary.length > 0) && (
                            <div className="mt-3">
                              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">{tt("library")}</p>
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {pdfPhotoLibrary.map((url, idx) => {
                                  const selected = selectedPdfPhotos.includes(url);
                                  return (
                                    <button
                                      key={`report-lib-${eIdx}-${idx}`}
                                      type="button"
                                      onClick={() => togglePdfPhotoForEtappe(eIdx, url)}
                                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                                        selected ? "border-indigo-500 ring-2 ring-indigo-200" : "border-gray-200 hover:border-indigo-300"
                                      }`}
                                    >
                                      <MediaImg src={url} alt={`Foto ${idx + 1}`} className="w-full h-20 object-cover" />
                                      {selected && (
                                        <span className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white">
                                          <Check className="w-3 h-3" />
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Bucket List Tab */}
            {activeTab === "bucket" && (
              <div className="space-y-6">
                {/* My Bucket List */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Meine Bucket List ({trip.bucketList.length})
                  </h3>
                  {trip.bucketList.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">
                      {tt("bucketEmptyRoute")}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {trip.bucketList.map((item) => {
                        const isStop = trip.stops.some((s) => s.name === item.name);
                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 bg-green-50 rounded-xl px-4 py-3"
                          >
                            <a
                              href={`https://www.google.com/maps/search/${encodeURIComponent(item.name)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-green-400 transition-all mt-0.5"
                              title={tt("openMaps")}
                            >
                              <MapPin className="w-4 h-4 text-green-600" />
                            </a>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800">{item.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-gray-400">{item.category}</span>
                                {item.rating > 0 && (
                                  <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    {item.rating}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-1.5">
                                {!isStop ? (
                                  <button
                                    onClick={() => {
                                      const endIdx = currentRouteStops.findIndex((s) => s.type === "end");
                                      const insertIdx = endIdx >= 0 ? endIdx : currentRouteStops.length;
                                      const discoveryEtappeIndex = Math.max(
                                        0,
                                        currentRouteStops
                                          .slice(0, insertIdx)
                                          .filter((s) => s.type === "stop" && !!s.isHotel).length
                                      );
                                      void addStopSmart(item.name, item.lat, item.lng, {
                                        discoverySource: "bucket",
                                        discoveryCategory: item.category || "Bucket List",
                                        discoveryEtappeIndex,
                                        discoveryAddedAt: new Date().toISOString(),
                                        discoveryWikipediaTitle: item.wikipediaTitle,
                                      });
                                    }}
                                    className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                                  >
                                    <Plus className="w-3 h-3" />{tt("asStop")}</button>
                                ) : (
                                  <span className="flex items-center gap-1 text-[11px] font-medium text-green-600">
                                    <Check className="w-3 h-3" />{tt("inRoute")}</span>
                                )}
                                <button
                                  onClick={() => removeFromBucketList(item.id)}
                                  className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3 h-3" />{tt("remove")}</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Landmark Explorer */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">{tt("discoverLandmarks")}</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    {bucketTabWorldwide
                      ? "Weltweite Suche aktiv."
                      : tt("bucketScopeDefault")}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setBucketDiscoveryScope("route");
                        setLandmarkQuery("");
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        !bucketTabWorldwide
                          ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {tt("poiAlongRoute")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBucketDiscoveryScope("worldwide")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        bucketTabWorldwide
                          ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      <Globe className="w-3 h-3" />{tt("featWorld")}</button>
                  </div>

                  {/* Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={bucketTabWorldwide ? "Suche nach Ort, Land, Stadt..." : "Anderen Ort weltweit suchen..."}
                      value={landmarkQuery}
                      onChange={(e) => {
                        const value = e.target.value;
                        setLandmarkQuery(value);
                        if (value.trim()) setBucketDiscoveryScope("worldwide");
                      }}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => setLandmarkUnescoOnly(!landmarkUnescoOnly)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        landmarkUnescoOnly
                          ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      UNESCO
                    </button>
                    <select
                      value={landmarkContinent}
                      onChange={(e) => setLandmarkContinent(e.target.value)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border-0 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{tt("allContinents")}</option>
                      {CONTINENTS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <select
                      value={landmarkCategory}
                      onChange={(e) => setLandmarkCategory(e.target.value)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border-0 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{tt("allCategories")}</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <BucketListMap
                    markers={bucketTabMapMarkers}
                    fitPositions={bucketTabFitPositions}
                    onAddAsStop={addBucketPoiAsStop}
                    onAddToBucketList={addLandmarkPoiToBucket}
                    isInRoute={isInCurrentRoute}
                    isInBucketList={isInBucketList}
                  />

                  {/* Results */}
                  {(() => {
                    const filtered = bucketTabFilteredLandmarks;
                    const shown = filtered.slice(0, 30);
                    const inBucketNames = new Set(trip.bucketList.map((b) => b.name));
                    const routeLabel = origin && destination ? `${origin} → ${destination}` : "deiner Route";

                    return (
                      <>
                        <p className="text-[11px] text-gray-400 mb-3">
                          {filtered.length} Ergebnis{filtered.length !== 1 ? "se" : ""}
                          {!bucketTabWorldwide ? ` entlang ${routeLabel}` : " weltweit"}
                          {filtered.length > 30 && " (erste 30 angezeigt)"}
                        </p>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                          {shown.map((lm) => {
                            const inBucket = inBucketNames.has(lm.name);
                            const isStop = trip.stops.some((s) => s.name === lm.name);
                            return (
                              <div
                                key={lm.id}
                                className="flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-gray-50 transition-colors border border-gray-50"
                              >
                                <WikiThumb wikiTitle={lm.wikipediaTitleDe} alt={lm.name} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-medium text-gray-800 truncate">{lm.name}</p>
                                    {lm.unesco?.isWorldHeritage && (
                                      <span className="flex-shrink-0 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-full">
                                        UNESCO
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-400 mt-0.5">
                                    {lm.category} · {lm.city}, {lm.country}
                                  </p>
                                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{lm.description}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    {!inBucket ? (
                                      <button
                                        onClick={() =>
                                          addToBucketList({
                                            name: lm.name,
                                            category: lm.category,
                                            rating: 0,
                                            description: lm.description,
                                            lat: lm.latitude,
                                            lng: lm.longitude,
                                            wikipediaTitle: lm.wikipediaTitleDe || lm.wikipediaTitle,
                                          })
                                        }
                                        className="flex items-center gap-1 text-[11px] font-medium text-green-600 hover:text-green-700"
                                      >
                                        <BookmarkPlus className="w-3 h-3" />{t("tabBucket")}</button>
                                    ) : (
                                      <span className="flex items-center gap-1 text-[11px] font-medium text-green-600">
                                        <Check className="w-3 h-3" />{tt("onList")}</span>
                                    )}
                                    {!isStop && (
                                      <button
                                        onClick={() => addStopSmart(lm.name, lm.latitude, lm.longitude)}
                                        className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                                      >
                                        <Plus className="w-3 h-3" />{tt("asStop")}</button>
                                    )}
                                    {isStop && (
                                      <span className="flex items-center gap-1 text-[11px] font-medium text-green-600">
                                        <Check className="w-3 h-3" />{tt("inRoute")}</span>
                                    )}
                                    {(lm.wikipediaTitleDe || lm.wikipediaTitle) && (
                                      <a
                                        href={wikipediaArticleUrl(
                                          lm.wikipediaTitleDe || lm.wikipediaTitle || "",
                                          locale,
                                        )}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] text-gray-400 hover:text-blue-500 transition-colors"
                                      >
                                        Wikipedia
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {!landmarksLoaded && (
                            <div className="text-center py-8">
                              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                              <p className="text-xs text-gray-400">{tt("loadingLandmarks")}</p>
                            </div>
                          )}
                          {landmarksLoaded && filtered.length === 0 && (
                            <div className="text-center py-8">
                              <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                              <p className="text-sm text-gray-400">
                                {bucketTabWorldwide
                                  ? "Keine Ergebnisse gefunden."
                                  : bucketTabFitPositions.length === 0
                                    ? "Noch keine Route mit Koordinaten. Berechne zuerst deine Route im Autoroute-Tab."
                                    : tt("landmarksNearRouteEmpty")}
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Flights Tab */}
            {activeTab === "flights" && (() => {
              const flightSearchParams = {
                origin: flightFrom,
                destination: flightTo,
                checkIn: flightDepart,
                checkOut: flightReturn,
                travelers: flightPassengers,
              };
              return (
              <div className="space-y-6">
                {/* Flight Search Form */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{tt("flightSearch")}</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <AirportSelect
                        value={flightFrom}
                        onChange={setFlightFrom}
                        placeholder={tt("flightFromPh")}
                        label="Von"
                      />
                      <AirportSelect
                        value={flightTo}
                        onChange={setFlightTo}
                        placeholder={tt("flightToPh")}
                        label="Nach"
                      />
                    </div>

                    <DateRangePicker
                      startDate={flightDepart}
                      endDate={flightReturn}
                      onSelect={(s, e) => { setFlightDepart(s); setFlightReturn(e); }}
                      startLabel={tt("outbound")}
                      endLabel={tt("returnFlight")}
                    />

                    <div>
                      <label className="block text-[11px] font-medium text-gray-400 mb-1">Passagiere</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setFlightPassengers(Math.max(1, flightPassengers - 1))}
                          className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium text-gray-800 w-8 text-center">{flightPassengers}</span>
                        <button
                          onClick={() => setFlightPassengers(Math.min(9, flightPassengers + 1))}
                          className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Providers */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    {
                      name: "Google Flights",
                      desc: "Umfassender Preisvergleich",
                      color: "text-blue-700",
                      bg: "bg-blue-50",
                      link: buildGoogleFlightsLink(flightSearchParams),
                    },
                    {
                      name: "Booking.com Flights",
                      desc: "Direktbuchung mit Bestpreis",
                      color: "text-indigo-700",
                      bg: "bg-indigo-50",
                      link: buildBookingFlightsLink(flightSearchParams),
                    },
                    {
                      name: "Skyscanner",
                      desc: "Vergleicht hunderte Airlines",
                      color: "text-cyan-700",
                      bg: "bg-cyan-50",
                      link: buildSkyscannerLink(flightSearchParams),
                    },
                    {
                      name: "Kayak",
                      desc: "Flexible Suche & Preisalarm",
                      color: "text-orange-700",
                      bg: "bg-orange-50",
                      link: buildKayakLink(flightSearchParams),
                    },
                  ].map((provider) => {
                    const brand = partnerLabelFromUrl(provider.link).brandName;
                    return (
                    <a
                      key={provider.name}
                      href={provider.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logAffiliateClick("flights", brand, provider.link)}
                      className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 ${provider.bg} rounded-xl flex items-center justify-center`}>
                          <Plane className={`w-6 h-6 ${provider.color}`} />
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {brand}
                        <PartnerAffiliateMark href={provider.link} />
                      </h4>
                      <p className="text-xs text-gray-400">{provider.desc}</p>
                      <div className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${provider.color} ${provider.bg} px-2.5 py-1 rounded-full`}>
                        <Search className="w-3 h-3" />{tt("searchFlights")}</div>
                    </a>
                  );
                  })}
                </div>
              </div>
              );
            })()}

            {/* Car Tab - Affiliate Links */}
            {activeTab === "car" && (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      name: "Booking.com Cars",
                      desc: "Mietwagen weltweit vergleichen",
                      color: "text-blue-700",
                      bg: "bg-blue-50",
                      link: buildBookingCarsLink(searchParams),
                    },
                    {
                      name: "Rentalcars.com",
                      desc: "Über 900 Anbieter vergleichen",
                      color: "text-green-700",
                      bg: "bg-green-50",
                      link: buildRentalcarsLink(searchParams),
                    },
                    {
                      name: "billiger-mietwagen.de",
                      desc: "Deutscher Preisvergleich",
                      color: "text-orange-700",
                      bg: "bg-orange-50",
                      link: buildBilligerMietwagenLink(searchParams),
                    },
                  ].map((provider) => {
                    const brand = partnerLabelFromUrl(provider.link).brandName;
                    return (
                    <a
                      key={provider.name}
                      href={provider.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logAffiliateClick("car", brand, provider.link)}
                      className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 ${provider.bg} rounded-xl flex items-center justify-center`}>
                          <Car className={`w-6 h-6 ${provider.color}`} />
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {brand}
                        <PartnerAffiliateMark href={provider.link} />
                      </h4>
                      <p className="text-xs text-gray-400 mb-3">{provider.desc}</p>
                      {destination && (
                        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5 mb-3">
                          <span className="font-medium">{destination}</span>
                          {trip.startDate && ` · ab ${formatDate(trip.startDate)}`}
                        </div>
                      )}
                      <div className={`inline-flex items-center gap-1 text-xs font-medium ${provider.color} ${provider.bg} px-2.5 py-1 rounded-full`}>
                        <Search className="w-3 h-3" />{tt("searchCars")}</div>
                    </a>
                  );
                  })}
                </div>
              </div>
            )}

            {/* Train Tab - Affiliate Links */}
            {activeTab === "train" && (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    {
                      name: "Trainline",
                      desc: "Europaweit Züge & Busse buchen",
                      color: "text-teal-700",
                      bg: "bg-teal-50",
                      link: buildTrainlineLink(searchParams),
                    },
                    {
                      name: "Omio",
                      desc: "Zug, Bus & Flug vergleichen",
                      color: "text-indigo-700",
                      bg: "bg-indigo-50",
                      link: buildOmioLink(searchParams),
                    },
                  ].map((provider) => (
                    <a
                      key={provider.name}
                      href={provider.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logAffiliateClick("train", provider.name, provider.link)}
                      className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 ${provider.bg} rounded-xl flex items-center justify-center`}>
                          <Train className={`w-6 h-6 ${provider.color}`} />
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{provider.name}</h4>
                      <p className="text-xs text-gray-400 mb-3">{provider.desc}</p>
                      {origin && destination && (
                        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5 mb-3">
                          <span className="font-medium">{origin}</span>
                          <ArrowRight className="w-3 h-3 inline mx-1.5" />
                          <span className="font-medium">{destination}</span>
                          {trip.startDate && ` · ${formatDate(trip.startDate)}`}
                        </div>
                      )}
                      <div className={`inline-flex items-center gap-1 text-xs font-medium ${provider.color} ${provider.bg} px-2.5 py-1 rounded-full`}>
                        <Search className="w-3 h-3" />{tt("searchTrains")}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* eSIM Tab */}
            {activeTab === "esim" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-pink-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-pink-800">{tt("esimTitle")}</p>
                      <p className="text-sm text-pink-600 mt-1">
                        Bleibe weltweit verbunden ohne teure Roaming-Kosten.
                        Kaufe eine eSIM vor der Abreise und aktiviere sie am Zielort.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    {
                      name: "Airalo",
                      desc: "200+ Länder & Regionen abgedeckt",
                      commission: "10–20%",
                      color: "text-blue-700",
                      bg: "bg-blue-50",
                      link: buildAiraloLink(destination),
                    },
                    {
                      name: "Holafly",
                      desc: "Unbegrenzte Daten in 100+ Ländern",
                      commission: "10–15%",
                      color: "text-green-700",
                      bg: "bg-green-50",
                      link: buildHolaflyLink(destination),
                    },
                    {
                      name: "Nomad eSIM",
                      desc: "Günstige Datentarife weltweit",
                      commission: "10–20%",
                      color: "text-purple-700",
                      bg: "bg-purple-50",
                      link: buildNomadEsimLink(destination),
                    },
                  ].map((provider) => (
                    <a
                      key={provider.name}
                      href={provider.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logAffiliateClick("esim", provider.name, provider.link)}
                      className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 ${provider.bg} rounded-xl flex items-center justify-center`}>
                          <Smartphone className={`w-6 h-6 ${provider.color}`} />
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{provider.name}</h4>
                      <p className="text-xs text-gray-400 mb-3">{provider.desc}</p>
                      {destination && (
                        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5 mb-3">{tt("destinationLabel")}<span className="font-medium">{destination}</span>
                        </div>
                      )}
                      <div className={`inline-flex items-center gap-1 text-xs font-medium ${provider.color} ${provider.bg} px-2.5 py-1 rounded-full`}>
                        <Search className="w-3 h-3" />{tt("findEsim")}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Drone Maps Tab */}
            {activeTab === "droneMaps" && (() => {
              const droneCountryAliases: Record<string, string> = {
                schweiz: "CH", switzerland: "CH", suiza: "CH", suisse: "CH", svizzera: "CH",
                italien: "IT", italy: "IT", italia: "IT", italie: "IT",
                frankreich: "FR", france: "FR", francia: "FR",
                spanien: "ES", spain: "ES", "españa": "ES", espagne: "ES", spagna: "ES",
                portugal: "PT", portogallo: "PT",
                "österreich": "AT", austria: "AT", autriche: "AT",
                deutschland: "DE", germany: "DE", alemania: "DE", allemagne: "DE", germania: "DE",
                liechtenstein: "LI",
              };
              const droneCountryNames: Record<string, string> = {
                CH: "Schweiz", IT: "Italien", FR: "Frankreich", ES: "Spanien", PT: "Portugal",
                AT: "Österreich", DE: "Deutschland", LI: "Liechtenstein",
              };
              const dronePortals: Record<string, { name: string; desc: string; link: string; color: string; bg: string }> = {
                ES: {
                  name: "ENAIRE Drones",
                  desc: "Offizielle UAS-Karte für Spanien",
                  link: "https://drones.enaire.es/",
                  color: "text-orange-700",
                  bg: "bg-orange-50",
                },
                PT: {
                  name: "ANAC Zonenkarte",
                  desc: "Geografische UAS-Zonen (Portugal)",
                  link: "https://www.anac.pt/vPT/Generico/drones/zona_proibidas_condicionadas/Paginas/Zonasproibidasoucondicionadas.aspx",
                  color: "text-emerald-700",
                  bg: "bg-emerald-50",
                },
                FR: {
                  name: "Geoportail Drones",
                  desc: "Karte mit Drohnen-Einschränkungen",
                  link: "https://www.geoportail.gouv.fr/donnees/restrictions-pour-drones-de-loisir",
                  color: "text-indigo-700",
                  bg: "bg-indigo-50",
                },
                CH: {
                  name: "FOCA Drone Map",
                  desc: "BAZL-Karte für Drohnenzonen",
                  link: "https://map.geo.admin.ch/#/map?lang=de&topic=aviation&layers=ch.bazl.einschraenkungen-drohnen",
                  color: "text-rose-700",
                  bg: "bg-rose-50",
                },
                IT: {
                  name: "d-flight",
                  desc: "Offizielle UAS-Zonenkarte für Italien (ENAC/ENAV)",
                  link: "https://www.d-flight.it/new_portal/services/mappe/",
                  color: "text-green-700",
                  bg: "bg-green-50",
                },
              };
              const routeCountries: { key: string; label: string }[] = [];
              for (const leg of routeInfo?.legs || []) {
                for (const raw of leg.countries || []) {
                  const name = raw.trim();
                  if (!name) continue;
                  const code = droneCountryAliases[name.toLowerCase()];
                  const key = code || name.toLowerCase();
                  if (routeCountries.some((c) => c.key === key)) continue;
                  routeCountries.push({ key, label: code ? droneCountryNames[code] : name });
                }
              }

              return (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <Map className="w-5 h-5 text-cyan-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-cyan-900">
                        {tt("droneMapsRouteTitle")}
                      </p>
                      <p className="text-sm text-cyan-700 mt-1">
                        {tt("droneIntro")}
                      </p>
                    </div>
                  </div>
                </div>

                {routeCountries.length === 0 ? (
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-600">
                      {tt("droneNoCountriesHint", { tab: t("tabRoute") })}
                    </p>
                  </div>
                ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {routeCountries.map(({ key, label }) => {
                    const portal = dronePortals[key];
                    if (!portal) {
                      return (
                        <div key={key} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-3">
                            <Map className="w-6 h-6 text-gray-400" />
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">{label}</h4>
                          <p className="text-xs text-gray-500">Noch keine offizielle Karte hinterlegt</p>
                        </div>
                      );
                    }
                    return (
                      <a
                        key={key}
                        href={portal.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => logAffiliateClick("droneMaps", portal.name, portal.link)}
                        className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-12 h-12 ${portal.bg} rounded-xl flex items-center justify-center`}>
                            <Map className={`w-6 h-6 ${portal.color}`} />
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">{label}</h4>
                        <p className="text-sm text-gray-700 mb-1">{portal.name}</p>
                        <p className="text-xs text-gray-500 mb-3">{portal.desc}</p>
                        <div className={`inline-flex items-center gap-1 text-xs font-medium ${portal.color} ${portal.bg} px-2.5 py-1 rounded-full`}>
                          <Map className="w-3 h-3" />{tt("openMap")}</div>
                      </a>
                    );
                  })}
                </div>
                )}
              </div>
              );
            })()}

            {/* POI Tab */}
            {activeTab === "poi" && (
              <div className="space-y-6">
                {/* Mode Switcher */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setPoiScope("ai")}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all ${
                      poiScope === "ai"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-purple-50"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {tt("aiRecsTitle")}
                  </button>
                  <button
                    onClick={() => { setPoiScope("route"); setPoisSearchedFor(""); }}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all ${
                      poiScope === "route"
                        ? "bg-green-600 text-white shadow-sm"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-green-50"
                    }`}
                  >
                    <Route className="w-3.5 h-3.5" />
                    Google Places
                  </button>
                  {destination && (
                    <button
                      onClick={() => { setPoiScope("destination"); setPoisSearchedFor(""); }}
                      className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all ${
                        poiScope === "destination"
                          ? "bg-green-600 text-white shadow-sm"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-green-50"
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Nur {destination}
                    </button>
                  )}
                </div>

                {/* AI Recommendations Mode */}
                {poiScope === "ai" && (
                  <div className="space-y-5">
                    {/* Interest Selection */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-5">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-purple-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-purple-800">
                            Was interessiert dich?
                          </p>
                          <p className="text-xs text-purple-600 mt-1 mb-3">
                            {tt("interestsChooseAi")}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {interestOptions.map((opt) => {
                              const active = (trip.interests || []).includes(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => toggleInterest(opt.id)}
                                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                                    active
                                      ? "bg-purple-600 text-white shadow-sm"
                                      : "bg-white text-gray-600 border border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                                  }`}
                                >
                                  <span>{opt.emoji}</span>
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Error */}
                    {aiPoisError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                        {aiPoisError}
                      </div>
                    )}

                    {/* Etappen with per-etappe AI buttons */}
                    {etappen.length > 0 ? (
                      <div className="space-y-4">
                        {/* All-in-one button */}
                        {etappen.length > 1 && (
                          <button
                            onClick={loadAllAiPois}
                            disabled={aiPoisLoading}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {aiPoisLoading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{tt("aiAllLoading")}</>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />{tt("aiAll")}</>
                            )}
                          </button>
                        )}

                        {etappen.map((etappe, eIdx) => {
                          const suggestions = aiPois.filter((p) => p.etappeIndex === eIdx);
                          const isLoading = aiLoadingEtappe === eIdx;
                          const selectedDiscoveries = getAiDiscoveriesForEtappe(eIdx);
                          const selectedPdfPhotos = getSelectedPdfPhotosForEtappe(eIdx);
                          const pdfPhotoLibrary = getPdfPhotoLibraryForEtappe(eIdx);
                          const pdfPhotoPlacement = trip.pdfPhotoPlacementByEtappe?.[String(eIdx)] || "afterEntdecken";
                          const pdfPhotoLayout = trip.pdfPhotoLayoutByEtappe?.[String(eIdx)] || "auto";
                          const pdfPhotoPages = trip.pdfPhotoPagesByEtappe?.[String(eIdx)] || 1;
                          const targetPagesInput = photoTargetPagesByEtappe[eIdx] || pdfPhotoPages || 1;
                          const layoutSourcePhotos = selectedPdfPhotos.length > 0 ? selectedPdfPhotos : pdfPhotoLibrary;
                          const recommendedLayouts = getRecommendedPdfLayouts(layoutSourcePhotos);
                          const effectivePreviewLayout = pdfPhotoLayout === "auto" ? (recommendedLayouts[0] || "grid") : pdfPhotoLayout;
                          const layoutChoices = Array.from(new Set([pdfPhotoLayout, ...recommendedLayouts]));
                          const isLayoutActive = (layout: PdfPhotoLayout) =>
                            pdfPhotoLayout === layout || (pdfPhotoLayout === "auto" && effectivePreviewLayout === layout);
                          const isCustomTabActive = openCustomStopEtappe === eIdx;
                          const isPhotoTabActive = openPhotoPickerEtappe === eIdx;
                          const isDiscoverTabActive = !isCustomTabActive && !isPhotoTabActive;
                          const activeTabSurfaceClass = isCustomTabActive
                            ? "border-purple-200 border-b-purple-50 bg-purple-50"
                            : isPhotoTabActive
                            ? "border-indigo-200 border-b-indigo-50 bg-indigo-50"
                            : "border-purple-200 border-b-white bg-white";
                          const etappeActionTabClass = (isActive: boolean) =>
                            isActive
                              ? `relative z-10 flex items-center gap-1.5 px-3 pt-2 pb-4 -mb-4 rounded-t-lg rounded-b-none text-xs font-medium transition-all ${activeTabSurfaceClass} text-indigo-700 border`
                              : "flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg rounded-bl-lg rounded-br-none text-xs font-medium transition-all border border-white/20 bg-white/15 hover:bg-white/25 text-white";
                          const renderLayoutSlot = (layout: PdfPhotoLayout, slotIdx: number, className = "") => {
                            const url = selectedPdfPhotos[slotIdx];
                            const canDragDrop = isLayoutActive(layout);
                            return (
                              <div
                                className={`border rounded ${url ? "border-gray-300" : "border-dashed border-gray-200"} ${className}`}
                                onDragOver={(ev) => {
                                  if (!canDragDrop) return;
                                  ev.preventDefault();
                                }}
                                onDrop={(ev) => {
                                  if (!canDragDrop) return;
                                  ev.preventDefault();
                                  const fromRaw = ev.dataTransfer.getData("text/plain");
                                  const fromIndex = Number(fromRaw);
                                  if (Number.isFinite(fromIndex)) {
                                    movePdfPhotoSlot(eIdx, fromIndex, slotIdx);
                                  }
                                  setDraggingPhotoSlotByEtappe((prev) => ({ ...prev, [eIdx]: null }));
                                }}
                                title={canDragDrop ? "Foto hierhin ziehen" : undefined}
                              >
                                {url ? (
                                  <img
                                    src={url}
                                    alt={`Layout ${slotIdx + 1}`}
                                    className={`w-full h-full object-contain ${draggingPhotoSlotByEtappe[eIdx] === slotIdx ? "opacity-40" : ""}`}
                                    draggable={canDragDrop}
                                    onDragStart={(ev) => {
                                      if (!canDragDrop) return;
                                      ev.dataTransfer.setData("text/plain", String(slotIdx));
                                      setDraggingPhotoSlotByEtappe((prev) => ({ ...prev, [eIdx]: slotIdx }));
                                    }}
                                    onDragEnd={() => setDraggingPhotoSlotByEtappe((prev) => ({ ...prev, [eIdx]: null }))}
                                  />
                                ) : null}
                              </div>
                            );
                          };
                          return (
                            <div key={eIdx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-5 py-3 flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-white/70 font-medium">Etappe {eIdx + 1} · {etappe.distanceKm} km · {etappe.durationFormatted}</p>
                                  <p className="text-sm text-white font-semibold">{etappe.from} → {etappe.to}</p>
                                </div>
                                <div className="flex items-end gap-2">
                                  <button
                                    onClick={() => {
                                      setOpenCustomStopEtappe((prev) => (prev === eIdx ? null : prev));
                                      void loadAiPoisForEtappe(eIdx);
                                    }}
                                    disabled={isLoading || aiPoisLoading}
                                    className={`${etappeActionTabClass(isDiscoverTabActive)} disabled:opacity-50`}
                                  >
                                    {isLoading ? (
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Sparkles className="w-3 h-3" />
                                    )}
                                    {suggestions.length > 0 ? "Neu" : "Entdecken"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenCustomStopEtappe((prev) => (prev === eIdx ? null : eIdx));
                                    }}
                                    className={etappeActionTabClass(isCustomTabActive)}
                                  >
                                    <Plus className="w-3 h-3" />{tt("customStop")}</button>
                                  <button
                                    onClick={() => setOpenEtappeMapIndex(eIdx)}
                                    disabled={suggestions.length === 0}
                                    className={`${etappeActionTabClass(false)} disabled:opacity-40 disabled:cursor-not-allowed`}
                                    title={suggestions.length > 0 ? tt("openEtappeMap") : tt("loadHighlightsFirst")}
                                  >
                                    <Map className="w-3 h-3" />
                                    Karte
                                  </button>
                                </div>
                              </div>
                              {openPhotoPickerEtappe === eIdx && (
                                <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                                  <div className="flex items-center justify-between gap-3 mb-3">
                                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                                      PDF Fotos für Etappe {eIdx + 1}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <select
                                        value={pdfPhotoPlacement}
                                        onChange={(ev) => setPdfPhotoPlacementForEtappe(eIdx, ev.target.value as PdfPhotoPlacement)}
                                        className="text-xs px-2 py-1 rounded-lg border border-indigo-200 bg-white text-gray-700"
                                      >
                                        <option value="afterHotel">{tt("afterHotel")}</option>
                                        <option value="afterTeilstrecken">{tt("afterLegs")}</option>
                                        <option value="afterEntdecken">{tt("afterDiscover")}</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="text-xs text-indigo-700 mb-3">{tt("devicePhotos")}</div>
                                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer">
                                    <FolderOpen className="w-3.5 h-3.5" />{tt("selectPhotos")}<input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      className="hidden"
                                      onChange={(ev) => {
                                        void addPickedPdfPhotosToEtappe(eIdx, ev.target.files);
                                        ev.currentTarget.value = "";
                                      }}
                                    />
                                  </label>
                                  <div className="mt-3 flex items-center gap-2">
                                    <input
                                      type="number"
                                      min={1}
                                      max={12}
                                      value={targetPagesInput}
                                      onChange={(ev) =>
                                        setPhotoTargetPagesByEtappe((prev) => ({
                                          ...prev,
                                          [eIdx]: Math.max(1, Math.min(12, Number(ev.target.value) || 1)),
                                        }))
                                      }
                                      className="w-20 text-xs px-2 py-1.5 rounded-lg border border-indigo-200 bg-white text-gray-700"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPdfPhotoLayoutForEtappe(eIdx, "smartPages");
                                        setPdfPhotoPagesForEtappe(eIdx, targetPagesInput);
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-indigo-300 text-indigo-700 text-xs font-semibold hover:bg-indigo-100"
                                    >{tt("spreadPages")}</button>
                                  </div>
                                  {(selectedPdfPhotos.length > 0 || pdfPhotoLibrary.length > 0) && (
                                    <>
                                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {layoutChoices.filter((layout) => layout !== "auto").map((layout) => (
                                          <button
                                            key={`${eIdx}-${layout}`}
                                            type="button"
                                            onClick={() => setPdfPhotoLayoutForEtappe(eIdx, layout)}
                                            className={`rounded-xl border p-3 text-left transition-all ${
                                              pdfPhotoLayout === layout || (pdfPhotoLayout === "auto" && effectivePreviewLayout === layout)
                                                ? "border-indigo-500 ring-2 ring-indigo-200 bg-white"
                                                : "border-indigo-200 bg-white hover:border-indigo-300"
                                            }`}
                                          >
                                            <div className="w-full aspect-[1/1.414] border border-gray-300 rounded bg-white p-2">
                                              {layout === "onePerPageMax" && renderLayoutSlot(layout, 0, "w-full h-full border-2")}
                                              {layout === "onePortraitTopHalf" && (
                                                <div className="w-full h-full grid grid-rows-2 gap-1">
                                                  {renderLayoutSlot(layout, 0, "border-2")}
                                                  <div className="border border-dashed border-gray-200 rounded" />
                                                </div>
                                              )}
                                              {layout === "onePortraitBottomHalf" && (
                                                <div className="w-full h-full grid grid-rows-2 gap-1">
                                                  <div className="border border-dashed border-gray-200 rounded" />
                                                  {renderLayoutSlot(layout, 0, "border-2")}
                                                </div>
                                              )}
                                              {layout === "twoPortraitSideBySide" && (
                                                <div className="w-full h-full grid grid-cols-2 gap-1">
                                                  {renderLayoutSlot(layout, 0, "h-full")}
                                                  {renderLayoutSlot(layout, 1, "h-full")}
                                                </div>
                                              )}
                                              {layout === "twoPortraitStacked" && (
                                                <div className="w-full h-full grid grid-rows-2 gap-1">
                                                  {renderLayoutSlot(layout, 0)}
                                                  {renderLayoutSlot(layout, 1)}
                                                </div>
                                              )}
                                              {layout === "twoMixedStacked" && (
                                                <div className="w-full h-full grid grid-rows-2 gap-1">
                                                  {renderLayoutSlot(layout, 0, "mx-6")}
                                                  {renderLayoutSlot(layout, 1)}
                                                </div>
                                              )}
                                              {layout === "sixPortraitGrid" && (
                                                <div className="w-full h-full grid grid-cols-3 gap-1">
                                                  {Array.from({ length: 6 }).map((_, i) => (
                                                    <div key={i}>{renderLayoutSlot(layout, i)}</div>
                                                  ))}
                                                </div>
                                              )}
                                              {layout === "threePortraitOneLandscape" && (
                                                <div className="w-full h-full grid grid-cols-3 gap-1">
                                                  {renderLayoutSlot(layout, 0, "h-full")}
                                                  {renderLayoutSlot(layout, 1, "h-full")}
                                                  {renderLayoutSlot(layout, 2, "h-full")}
                                                  <div className="col-span-3 h-10 mt-1">{renderLayoutSlot(layout, 3, "h-full")}</div>
                                                </div>
                                              )}
                                              {layout === "grid" && (
                                                <div className="w-full h-full grid grid-cols-3 gap-1">
                                                  {Array.from({ length: 6 }).map((_, i) => (
                                                    <div key={i}>{renderLayoutSlot(layout, i)}</div>
                                                  ))}
                                                </div>
                                              )}
                                              {layout === "smartPages" && (
                                                <div className="w-full h-full grid grid-cols-2 gap-1">
                                                  <div className="h-12">{renderLayoutSlot(layout, 0, "h-full")}</div>
                                                  <div className="h-12">{renderLayoutSlot(layout, 1, "h-full")}</div>
                                                  <div className="col-span-2 h-16">{renderLayoutSlot(layout, 2, "h-full")}</div>
                                                </div>
                                              )}
                                            </div>
                                            <p className="mt-2 text-xs font-semibold text-indigo-800">
                                              {layout === "onePerPageMax" && "1 Bild ganzseitig"}
                                              {layout === "onePortraitTopHalf" && "1 Bild halbseitig oben"}
                                              {layout === "onePortraitBottomHalf" && "1 Bild halbseitig unten"}
                                              {layout === "twoPortraitSideBySide" && "2 Hochformat nebeneinander"}
                                              {layout === "twoPortraitStacked" && "2 Hochformat oben/unten"}
                                              {layout === "twoMixedStacked" && "1 Hoch + 1 Quer oben/unten"}
                                              {layout === "sixPortraitGrid" && "6 Hochformat (3 oben / 3 unten)"}
                                              {layout === "threePortraitOneLandscape" && "3 Hochformat + 1 Quer (unten)"}
                                              {layout === "grid" && "Raster (variabel)"}
                                              {layout === "smartPages" && "Automatisch auf Seiten verteilen"}
                                            </p>
                                          </button>
                                        ))}
                                      </div>

                                      <div className="mt-3">
                                        <p className="text-[11px] font-semibold text-indigo-700 mb-2 uppercase tracking-wide">{tt("libraryReuse")}</p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                          {pdfPhotoLibrary.map((url, idx) => (
                                            <button
                                              key={`lib-${idx}`}
                                              type="button"
                                              onClick={() => assignPhotoToEtappeSlot(eIdx, url)}
                                              className="relative rounded-lg overflow-hidden border-2 border-indigo-200 bg-white hover:border-indigo-400 transition-all"
                                              title={tt("insertNext")}
                                            >
                                              <div className="w-full h-20 p-1">
                                                <MediaImg src={url} alt={`Mediathek ${idx + 1}`} className="w-full h-full object-contain" />
                                              </div>
                                              {selectedPdfPhotos.includes(url) && (
                                                <div className="absolute top-1 right-1 bg-indigo-600 text-white rounded-full p-1">
                                                  <Check className="w-3 h-3" />
                                                </div>
                                              )}
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                    </>
                                  )}
                                </div>
                              )}
                              {openCustomStopEtappe === eIdx && (
                                <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={customStopQuery[eIdx] || ""}
                                      onChange={(e) => setCustomStopQuery((prev) => ({ ...prev, [eIdx]: e.target.value }))}
                                      placeholder={tt("wikiPh")}
                                      className="flex-1 px-3 py-2 rounded-lg border border-purple-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          void searchCustomDiscovery(eIdx);
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => void searchCustomDiscovery(eIdx)}
                                      disabled={!!customStopLoading[eIdx]}
                                      className="px-3 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-50"
                                    >
                                      {customStopLoading[eIdx] ? "Suche..." : "Suchen"}
                                    </button>
                                  </div>
                                  {customStopResult[eIdx] && (
                                    <div className="mt-3 rounded-xl bg-white border border-purple-100 p-3">
                                      {(() => {
                                        const actionKey = customStopActionKey(eIdx, customStopResult[eIdx]!.name);
                                        const customIsAdding = !!addingCustomStops[actionKey];
                                        const customAddedState = isDiscoveryLinkedInCurrentRoute(eIdx, customStopResult[eIdx]!.name);
                                        return (
                                      <div className="flex items-start gap-3">
                                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-purple-100 flex-shrink-0">
                                          {customStopResult[eIdx]?.photoUrl ? (
                                            <img
                                              src={customStopResult[eIdx]!.photoUrl}
                                              alt={customStopResult[eIdx]!.name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <Compass className="w-5 h-5 text-purple-500" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold text-gray-900">{customStopResult[eIdx]!.name}</p>
                                          <p className="text-[11px] text-gray-500 mt-1 line-clamp-5">{customStopResult[eIdx]!.description}</p>
                                          <div className="flex items-center gap-3 mt-2">
                                            <button
                                              type="button"
                                              onClick={() => void addCustomDiscoveryToRoute(eIdx)}
                                              disabled={customIsAdding || customAddedState}
                                              className={`text-[11px] font-semibold transition-colors ${
                                                customAddedState
                                                  ? "text-emerald-700 cursor-default"
                                                  : customIsAdding
                                                  ? "text-blue-500"
                                                  : "text-blue-600 hover:text-blue-700"
                                              }`}
                                            >
                                              {customAddedState ? "Als Stopp eingefügt" : customIsAdding ? "Wird als Stopp eingefügt..." : "+ Als Stopp einfügen"}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                addToBucketList({
                                                  name: customStopResult[eIdx]!.name,
                                                  category: "Eigener Stopp",
                                                  rating: 0,
                                                  description: customStopResult[eIdx]!.description,
                                                })
                                              }
                                              className="text-[11px] font-medium text-gray-500 hover:text-green-600"
                                            >{tt("toBucket")}</button>
                                          </div>
                                        </div>
                                      </div>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              )}
                              {selectedDiscoveries.length > 0 && (
                                <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
                                    <Check className="w-3.5 h-3.5" />
                                    Aus Entdecken übernommen ({selectedDiscoveries.length})
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedDiscoveries.map((stop) => (
                                      <span
                                        key={stop.id}
                                        className="inline-flex items-center gap-1 rounded-full bg-white border border-emerald-200 px-2.5 py-1 text-[11px] text-emerald-700"
                                        title={stop.discoveryDescription || stop.name}
                                      >
                                        <Check className="w-3 h-3" />
                                        {stop.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {suggestions.length > 0 && (
                                <div className="divide-y divide-gray-50">
                                  {suggestions.map((poi, pIdx) => {
                                    const inBucket = isInBucketList(poi.name);
                                    const photoUrl = aiPoiPhotos[poi.name];
                                    const actionKey = aiStopActionKey(eIdx, poi.name);
                                    const isAddingStop = !!addingAiStops[actionKey];
                                    const inRoute = isInCurrentRoute(poi.name);
                                    const justAdded = !!addedAiStops[actionKey];
                                    return (
                                      <div key={pIdx} className="p-4 hover:bg-purple-50/30 transition-colors">
                                        <div className="flex items-start gap-3">
                                          <a
                                            href={`https://www.google.com/maps/search/${encodeURIComponent(poi.name)}${poi.lat != null && poi.lng != null ? `/@${poi.lat},${poi.lng},14z` : ""}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-shrink-0"
                                            title={tt("openMaps")}
                                          >
                                            {photoUrl ? (
                                              <div className="w-16 h-16 rounded-xl overflow-hidden hover:ring-2 hover:ring-purple-400 transition-all">
                                                <img src={photoUrl} alt={poi.name} className="w-full h-full object-cover" />
                                              </div>
                                            ) : (
                                              <div className="w-16 h-16 rounded-xl bg-purple-100 flex items-center justify-center hover:ring-2 hover:ring-purple-400 transition-all">
                                                <Compass className="w-6 h-6 text-purple-400" />
                                              </div>
                                            )}
                                          </a>
                                          <div className="flex-1 min-w-0">
                                          <h4 className="text-sm font-semibold text-gray-900">{poi.name}</h4>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-medium text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">{poi.category}</span>
                                            {poi.detourMinutes != null && (
                                              <span className="text-[10px] text-gray-400">
                                                <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                                                ~{poi.detourMinutes} Min. Abstecher
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{poi.description}</p>
                                          <div className="flex items-center gap-3 mt-2.5">
                                            <button
                                              onClick={() => void addAiPoiToRoute(poi, eIdx)}
                                              disabled={isAddingStop || inRoute}
                                              className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
                                                inRoute || justAdded
                                                  ? "text-emerald-600"
                                                  : "text-blue-600 hover:text-blue-700"
                                              } disabled:opacity-80 disabled:cursor-not-allowed`}
                                            >
                                              {isAddingStop ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                              ) : inRoute || justAdded ? (
                                                <Check className="w-3 h-3" />
                                              ) : (
                                                <Plus className="w-3 h-3" />
                                              )}
                                              {isAddingStop
                                                ? "Wird hinzugefügt..."
                                                : inRoute
                                                ? "Bereits in Route"
                                                : justAdded
                                                ? "Hinzugefügt"
                                                : "Als Stopp einfügen"}
                                            </button>
                                            <button
                                              onClick={() =>
                                                inBucket
                                                  ? removeFromBucketList(trip.bucketList.find((b) => b.name === poi.name)!.id)
                                                  : addToBucketList({ name: poi.name, category: poi.category, rating: 0, description: poi.description })
                                              }
                                              className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
                                                inBucket ? "text-green-600" : "text-gray-400 hover:text-green-600"
                                              }`}
                                            >
                                              {inBucket ? <Check className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
                                              {inBucket ? "In Bucket List" : "Zur Bucket List"}
                                            </button>
                                          </div>
                                        </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {suggestions.length === 0 && !isLoading && (
                                <div className="px-5 py-4 text-xs text-gray-400 text-center">
                                  {tt("discoverTapAi")}
                                </div>
                              )}
                              {isLoading && (
                                <div className="px-5 py-6 flex items-center justify-center gap-2 text-purple-500">
                                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                  <span className="text-xs">KI sucht Empfehlungen...</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Route className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400">{tt("routeAiNeedHotels")}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Google Places Mode */}
                {(poiScope === "route" || poiScope === "destination") && (
                  <div className="space-y-5">
                    {/* Aktivitäten-Anbieter */}
                    {destination && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          {tt("toursActivitiesTitle")}
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4 mb-6">
                          <a
                            href={buildGetYourGuideLink(destination)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() =>
                              logAffiliateClick("activities", "GetYourGuide", buildGetYourGuideLink(destination))
                            }
                            className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-orange-600" />
                              </div>
                              <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-1">GetYourGuide</h4>
                            <p className="text-xs text-gray-400 mb-3">{tt("toursActivitiesDesc")}</p>
                            <div className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full">
                              <Search className="w-3 h-3" />
                              {tt("activitiesDiscover")}
                            </div>
                          </a>
                          <a
                            href={buildViatorLink(destination)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() =>
                              logAffiliateClick("activities", "Viator", buildViatorLink(destination))
                            }
                            className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                <Compass className="w-6 h-6 text-green-600" />
                              </div>
                              <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-1">Viator</h4>
                            <p className="text-xs text-gray-400 mb-3">Erlebnisse & Touren von TripAdvisor</p>
                            <div className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                              <Search className="w-3 h-3" />
                              Touren entdecken
                            </div>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Dynamic POIs */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                          {poiScope === "route"
                            ? tt("poiAlongRoute")
                            : destination
                              ? tt("poiInDest", { place: destination })
                              : tt("poiSights")}
                          {pois.length > 0 && ` (${pois.length})`}
                        </h3>
                        {!poisLoading && pois.length > 0 && (
                          <button
                            onClick={() => { setPoisSearchedFor(""); loadPOIs(poiScope as "route" | "destination"); }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Aktualisieren
                          </button>
                        )}
                      </div>

                      {poisLoading && (
                        <div className="flex items-center justify-center py-12">
                          <div className="flex items-center gap-3 text-gray-400">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">{tt("poisLoading")}</span>
                          </div>
                        </div>
                      )}

                      {!poisLoading && !destination && (
                        <div className="text-center py-8">
                          <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                          <p className="text-sm text-gray-400">{tt("enterDestForLandmarks")}</p>
                        </div>
                      )}

                      {!poisLoading && destination && displayPOIs.length === 0 && (
                        <div className="text-center py-8">
                          <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                          <p className="text-sm text-gray-400">{tt("noLandmarksFound")}</p>
                        </div>
                      )}

                      <div className="grid sm:grid-cols-2 gap-4">
                        {displayPOIs.map((poi) => {
                          const added = isInBucketList(poi.name);
                          return (
                            <div
                              key={poi.name}
                              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group overflow-hidden"
                            >
                              {poi.photoUrl && (
                                <div className="h-36 w-full overflow-hidden">
                                  <img
                                    src={poi.photoUrl}
                                    alt={poi.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                              )}
                              <div className="p-5">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                      {poi.name}
                                    </h4>
                                    <span className="text-xs text-gray-400">{poi.category}</span>
                                  </div>
                                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                    <span className="text-xs font-medium text-yellow-700">{poi.rating.toFixed(1)}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2">{poi.description}</p>
                                <button
                                  onClick={() =>
                                    added
                                      ? removeFromBucketList(trip.bucketList.find((b) => b.name === poi.name)!.id)
                                      : addToBucketList(poi)
                                  }
                                  className={`mt-3 flex items-center gap-1.5 text-xs font-medium transition-colors ${
                                    added ? "text-green-600" : "text-blue-600 hover:text-blue-700"
                                  }`}
                                >
                                  {added ? (
                                    <><Check className="w-3.5 h-3.5" />{tt("inBucket")}</>
                                  ) : (
                                    <><Plus className="w-3.5 h-3.5" />{tt("toBucket")}</>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Insurance Tab */}
            {activeTab === "insurance" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">{tt("insuranceTitle")}</p>
                      <p className="text-sm text-red-600 mt-1">
                        {tt("insuranceBody")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      name: "Allianz Travel",
                      desc: "Umfassender Reiseschutz vom Marktführer",
                      features: ["Reiserücktritt", "Krankenversicherung", "Gepäckschutz"],
                      color: "text-blue-700",
                      bg: "bg-blue-50",
                      link: buildAllianzTravelLink(),
                    },
                    {
                      name: "World Nomads",
                      desc: "Flexibel für Abenteurer & Backpacker",
                      features: ["Outdoor-Aktivitäten", "Flexible Laufzeit", "Weltweit"],
                      color: "text-green-700",
                      bg: "bg-green-50",
                      link: buildWorldNomadsLink(),
                    },
                    {
                      name: "ERGO Reiseversicherung",
                      desc: "Deutsche Qualität, faire Preise",
                      features: ["Familientarife", "Jahresschutz", "Storno-Schutz"],
                      color: "text-red-700",
                      bg: "bg-red-50",
                      link: "https://www.ergo.de/reiseversicherung",
                    },
                  ].map((provider) => (
                    <a
                      key={provider.name}
                      href={provider.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logAffiliateClick("insurance", provider.name, provider.link)}
                      className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 ${provider.bg} rounded-xl flex items-center justify-center`}>
                          <Shield className={`w-6 h-6 ${provider.color}`} />
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{provider.name}</h4>
                      <p className="text-xs text-gray-400 mb-3">{provider.desc}</p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {provider.features.map((f) => (
                          <span key={f} className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md">
                            {f}
                          </span>
                        ))}
                      </div>
                      <div className={`inline-flex items-center gap-1 text-xs font-medium ${provider.color} ${provider.bg} px-2.5 py-1 rounded-full`}>
                        <Search className="w-3 h-3" />{tt("viewOffers")}</div>
                    </a>
                  ))}
                </div>

                {showTips && trip.travelers > 1 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                    <p className="text-sm text-amber-700">
                      <strong>{tt("tip")}:</strong> {tt("familyTip", { n: trip.travelers })}
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
          )}
        </div>
      </div>
    </div>
  );
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDur(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}
