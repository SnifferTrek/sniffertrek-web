import { fetchLandmarkThumb } from "@/lib/landmarkService";
import type { MapHighlightPoi } from "@/components/GoogleMap";
import type { Landmark } from "@/lib/landmarkService";
import type { RouteStop } from "@/lib/types";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function filterPoisNearStops(
  pois: MapHighlightPoi[],
  stops: RouteStop[],
  radiusKm = 120
): MapHighlightPoi[] {
  const points = stops
    .filter((s) => s.lat != null && s.lng != null)
    .map((s) => ({ lat: Number(s.lat), lng: Number(s.lng) }));
  if (points.length === 0) return pois;
  return pois.filter((poi) =>
    points.some((p) => haversineKm(p.lat, p.lng, poi.lat, poi.lng) <= radiusKm)
  );
}

export function escapeBucketMapHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function landmarkToMapPoi(lm: Landmark, inMyBucketList = false): MapHighlightPoi {
  return {
    id: lm.id,
    name: lm.name,
    lat: lm.latitude,
    lng: lm.longitude,
    category: lm.category,
    description: lm.description,
    imageUrl: lm.imageURL || undefined,
    wikipediaTitle: lm.wikipediaTitleDe || lm.wikipediaTitle,
    inMyBucketList,
  };
}

export function bucketMarkerDomId(poi: MapHighlightPoi, prefix: string): string {
  return `${prefix}-${(poi.id || poi.name).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

export async function resolvePoiImageUrl(poi: MapHighlightPoi): Promise<string | null> {
  if (poi.imageUrl) return poi.imageUrl;
  if (poi.wikipediaTitle) return fetchLandmarkThumb(poi.wikipediaTitle);
  return null;
}

export function buildBucketPoiInfoHtml(
  poi: MapHighlightPoi,
  opts: {
    imageUrl?: string | null;
    inMyBucketList: boolean;
    inRoute: boolean;
    markerId: string;
    addBucketPrefix: string;
    addStopPrefix: string;
  }
): string {
  const img = opts.imageUrl
    ? `<img src="${escapeBucketMapHtml(opts.imageUrl)}" alt="" style="width:100%;height:140px;object-fit:cover;border-radius:8px;margin-bottom:8px;border:1px solid #e5e7eb" />`
    : "";
  const badge = opts.inMyBucketList
    ? `<div style="font-size:11px;color:#ef4444;margin-top:6px;font-weight:600">Meine Bucket List</div>`
    : "";
  const addBucketBtn = !opts.inMyBucketList
    ? `<button id="${opts.addBucketPrefix}-${opts.markerId}" type="button" style="width:100%;padding:8px 10px;font-size:11px;font-weight:600;color:#fff;background:#16a34a;border:0;border-radius:8px;cursor:pointer">Zu meiner Bucket List hinzufügen</button>`
    : "";
  const addStopBtn = !opts.inRoute
    ? `<button id="${opts.addStopPrefix}-${opts.markerId}" type="button" style="width:100%;padding:8px 10px;font-size:11px;font-weight:600;color:#fff;background:#0071e3;border:0;border-radius:8px;cursor:pointer">Als Stopp übernehmen</button>`
    : `<div style="font-size:11px;color:#16a34a;font-weight:600;text-align:center">Bereits in Route</div>`;

  return `<div style="font-family:system-ui;padding:6px 4px;min-width:280px;max-width:320px">
    ${img}
    <div style="font-size:14px;font-weight:600;color:#18181b;line-height:1.3">${escapeBucketMapHtml(poi.name)}</div>
    ${
      poi.category
        ? `<div style="font-size:11px;color:#71717a;margin-top:3px">${escapeBucketMapHtml(String(poi.category))}</div>`
        : ""
    }
    ${
      poi.description
        ? `<div style="font-size:11px;color:#52525b;margin-top:6px;line-height:1.45;max-height:80px;overflow:hidden">${escapeBucketMapHtml(poi.description)}</div>`
        : ""
    }
    ${badge}
    <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">
      ${addBucketBtn}
      ${addStopBtn}
    </div>
  </div>`;
}

export function wireBucketPoiInfoWindow(
  info: google.maps.InfoWindow,
  poi: MapHighlightPoi,
  markerId: string,
  opts: {
    addBucketPrefix: string;
    addStopPrefix: string;
    inMyBucketList: boolean;
    inRoute: boolean;
    onAddToBucketList?: (poi: MapHighlightPoi) => void;
    onAddAsStop?: (poi: MapHighlightPoi) => void;
  }
): void {
  google.maps.event.addListenerOnce(info, "domready", () => {
    if (!opts.inMyBucketList) {
      const bucketBtn = document.getElementById(`${opts.addBucketPrefix}-${markerId}`);
      bucketBtn?.addEventListener("click", () => {
        opts.onAddToBucketList?.(poi);
        info.close();
      });
    }
    if (!opts.inRoute) {
      const stopBtn = document.getElementById(`${opts.addStopPrefix}-${markerId}`);
      stopBtn?.addEventListener("click", () => {
        opts.onAddAsStop?.(poi);
        info.close();
      });
    }
  });
}
