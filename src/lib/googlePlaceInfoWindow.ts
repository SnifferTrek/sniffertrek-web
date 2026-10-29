import { escapeBucketMapHtml } from "@/lib/bucketMapPoi";

export type MapPlacePopupData = {
  placeId: string;
  name: string;
  formattedAddress: string;
  photoUrl?: string;
  category: string;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  openingHours?: string[];
  website?: string;
  phone?: string;
  googleMapsUrl?: string;
};

export type PlaceInfoLabels = {
  addToRoute: string;
  toBucket: string;
  inBucket: string;
  moreInfo: string;
  detailsTitle: string;
  reviews: string;
  priceLevel: string;
  openingHours: string;
  website: string;
  phone: string;
  openInMaps: string;
  googleAttribution: string;
  category: string;
  rating: string;
  noExtraInfo: string;
  back: string;
};

function placeIdSafe(placeId: string): string {
  return placeId.replace(/[^a-zA-Z0-9_-]/g, "");
}

function domIds(placeId: string) {
  const s = placeIdSafe(placeId);
  return {
    addBtnId: `add-route-poi-${s}`,
    bucketBtnId: `add-bucket-poi-${s}`,
    infoBtnId: `poi-info-${s}`,
    closeDetailsBtnId: `poi-info-close-${s}`,
  };
}

function formatPriceLevel(level?: number): string | undefined {
  if (level == null || level < 0) return undefined;
  if (level === 0) return "kostenlos";
  const euros = "€".repeat(Math.min(4, level));
  return euros;
}

function detailRow(label: string, value: string): string {
  return `<div style="margin-top:10px"><div style="font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.04em">${escapeBucketMapHtml(label)}</div><div style="font-size:12px;color:#374151;line-height:1.45;margin-top:2px">${value}</div></div>`;
}

function buildSummaryHtml(
  data: MapPlacePopupData,
  labels: PlaceInfoLabels,
  inBucket: boolean,
): string {
  const ids = domIds(data.placeId);
  const title = escapeBucketMapHtml(data.name);
  const address = escapeBucketMapHtml(data.formattedAddress).replace(/,/g, "<br/>");
  const bucketBtnLabel = inBucket ? labels.inBucket : labels.toBucket;
  const bucketBtnStyle = inBucket
    ? "border:1px solid #86efac;background:#ecfdf5;color:#15803d;cursor:default;"
    : "border:1px solid #d1d5db;background:#fff;color:#374151;cursor:pointer;";
  const photo = data.photoUrl
    ? `<div style="margin-top:8px"><img src="${escapeBucketMapHtml(data.photoUrl)}" alt="" style="width:100%;height:130px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb"/></div>`
    : "";
  const ratingHint =
    data.rating != null && data.rating > 0
      ? `<div style="font-size:11px;color:#6b7280;margin-top:4px">★ ${data.rating.toFixed(1)}${data.userRatingsTotal ? ` · ${data.userRatingsTotal} ${labels.reviews}` : ""}</div>`
      : "";

  return `<div style="font-family:system-ui;padding:4px 2px;min-width:220px;max-width:320px;position:relative">
    <button type="button" id="${ids.infoBtnId}" title="${escapeBucketMapHtml(labels.moreInfo)}" aria-label="${escapeBucketMapHtml(labels.moreInfo)}" style="position:absolute;top:0;right:0;width:26px;height:26px;border-radius:999px;border:1px solid #d1d5db;background:#fff;color:#374151;font-size:13px;font-weight:700;font-family:system-ui;cursor:pointer;line-height:1;padding:0">i</button>
    <div style="font-size:13px;font-weight:600;color:#1f2937;margin-bottom:4px;padding-right:32px">${title}</div>
    ${address ? `<div style="font-size:12px;color:#4b5563;line-height:1.35">${address}</div>` : ""}
    ${ratingHint}
    <div style="display:flex;gap:8px;margin-top:10px">
      <button type="button" id="${ids.addBtnId}" style="flex:1;padding:7px 10px;font-size:11px;font-weight:600;font-family:system-ui;color:#fff;background:#2563eb;border:0;border-radius:7px;cursor:pointer">${escapeBucketMapHtml(labels.addToRoute)}</button>
      <button type="button" id="${ids.bucketBtnId}" ${inBucket ? "disabled" : ""} style="flex:1;padding:7px 10px;font-size:11px;font-weight:600;font-family:system-ui;border-radius:7px;${bucketBtnStyle}">${escapeBucketMapHtml(bucketBtnLabel)}</button>
    </div>
    ${photo}
  </div>`;
}

function buildDetailsHtml(data: MapPlacePopupData, labels: PlaceInfoLabels): string {
  const ids = domIds(data.placeId);
  const title = escapeBucketMapHtml(data.name);
  const parts: string[] = [];

  if (data.category) {
    parts.push(detailRow(labels.category, escapeBucketMapHtml(data.category)));
  }
  if (data.rating != null && data.rating > 0) {
    const reviewText = data.userRatingsTotal
      ? `${data.rating.toFixed(1)} (${data.userRatingsTotal} ${labels.reviews})`
      : data.rating.toFixed(1);
    parts.push(detailRow(labels.rating, `★ ${escapeBucketMapHtml(reviewText)}`));
  }
  const price = formatPriceLevel(data.priceLevel);
  if (price) parts.push(detailRow(labels.priceLevel, escapeBucketMapHtml(price)));
  if (data.openingHours?.length) {
    const hours = data.openingHours.map((line) => escapeBucketMapHtml(line)).join("<br/>");
    parts.push(detailRow(labels.openingHours, hours));
  }
  if (data.phone) {
    const tel = escapeBucketMapHtml(data.phone);
    parts.push(
      detailRow(
        labels.phone,
        `<a href="tel:${tel.replace(/\s/g, "")}" style="color:#2563eb;text-decoration:none">${tel}</a>`,
      ),
    );
  }
  if (data.website) {
    const web = escapeBucketMapHtml(data.website);
    parts.push(
      detailRow(
        labels.website,
        `<a href="${web}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:none;word-break:break-all">${web}</a>`,
      ),
    );
  }
  if (data.googleMapsUrl) {
    const url = escapeBucketMapHtml(data.googleMapsUrl);
    parts.push(
      detailRow(
        labels.openInMaps,
        `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:none">${escapeBucketMapHtml(labels.openInMaps)}</a>`,
      ),
    );
  }

  const body =
    parts.length > 0
      ? parts.join("")
      : `<p style="font-size:12px;color:#6b7280;margin:12px 0 0">${escapeBucketMapHtml(labels.noExtraInfo)}</p>`;

  const photo = data.photoUrl
    ? `<img src="${escapeBucketMapHtml(data.photoUrl)}" alt="" style="width:100%;height:100px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:8px" />`
    : "";

  return `<div style="font-family:system-ui;padding:4px 2px;min-width:240px;max-width:340px;position:relative;max-height:360px;overflow-y:auto">
    <button type="button" id="${ids.closeDetailsBtnId}" title="${escapeBucketMapHtml(labels.back)}" aria-label="${escapeBucketMapHtml(labels.back)}" style="position:absolute;top:0;right:0;width:28px;height:28px;border-radius:8px;border:1px solid #e5e7eb;background:#f9fafb;color:#374151;font-size:18px;font-weight:400;font-family:system-ui;cursor:pointer;line-height:1;padding:0">×</button>
    <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;padding-right:36px">${escapeBucketMapHtml(labels.detailsTitle)}</div>
    <div style="font-size:14px;font-weight:600;color:#1f2937;margin-top:6px;padding-right:28px">${title}</div>
    ${photo}
    ${body}
    <div style="font-size:10px;color:#9ca3af;margin-top:12px;padding-top:8px;border-top:1px solid #f3f4f6">${escapeBucketMapHtml(labels.googleAttribution)}</div>
  </div>`;
}

export function placeResultToPopupData(
  placeId: string,
  place: google.maps.places.PlaceResult,
  opts: { photoUrl?: string; category: string },
): MapPlacePopupData {
  return {
    placeId,
    name: place.name || "Ort",
    formattedAddress: place.formatted_address || "",
    photoUrl: opts.photoUrl,
    category: opts.category,
    rating: place.rating,
    userRatingsTotal: place.user_ratings_total,
    priceLevel: place.price_level,
    openingHours: place.opening_hours?.weekday_text,
    website: place.website,
    phone: place.international_phone_number,
    googleMapsUrl: place.url,
  };
}

export function mountGooglePlaceInfoWindow(
  infoWindow: google.maps.InfoWindow,
  view: "summary" | "details",
  data: MapPlacePopupData,
  labels: PlaceInfoLabels,
  actions: {
    inBucket: boolean;
    onAddToRoute: () => void;
    onAddToBucket: () => void;
  },
): void {
  const content =
    view === "summary" ? buildSummaryHtml(data, labels, actions.inBucket) : buildDetailsHtml(data, labels);
  infoWindow.setContent(content);
  const ids = domIds(data.placeId);

  google.maps.event.addListenerOnce(infoWindow, "domready", () => {
    if (view === "summary") {
      document.getElementById(ids.addBtnId)?.addEventListener("click", () => {
        actions.onAddToRoute();
        infoWindow.close();
      });
      if (!actions.inBucket) {
        document.getElementById(ids.bucketBtnId)?.addEventListener("click", () => {
          actions.onAddToBucket();
          infoWindow.close();
        });
      }
      document.getElementById(ids.infoBtnId)?.addEventListener("click", () => {
        mountGooglePlaceInfoWindow(infoWindow, "details", data, labels, actions);
      });
      return;
    }
    document.getElementById(ids.closeDetailsBtnId)?.addEventListener("click", () => {
      mountGooglePlaceInfoWindow(infoWindow, "summary", data, labels, actions);
    });
  });
}

export const GOOGLE_PLACE_DETAIL_FIELDS = [
  "name",
  "formatted_address",
  "address_components",
  "photos",
  "types",
  "rating",
  "user_ratings_total",
  "price_level",
  "opening_hours",
  "website",
  "international_phone_number",
  "url",
] as const;
