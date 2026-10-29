export interface POI {
 id: string;
 name: string;
 category: string;
 rating: number;
 totalRatings: number;
 description: string;
 address: string;
 photoUrl?: string;
 lat: number;
 lng: number;
 types: string[];
}

const categoryMap: Record<string, string> = {
 tourist_attraction: "Sehenswürdigkeit",
 museum: "Museum",
 park: "Park",
 church: "Kirche",
 art_gallery: "Galerie",
 zoo: "Zoo",
 aquarium: "Aquarium",
 amusement_park: "Freizeitpark",
 stadium: "Stadion",
 restaurant: "Restaurant",
 cafe: "Café",
 bar: "Bar",
 night_club: "Nachtleben",
 shopping_mall: "Shopping",
 spa: "Wellness",
 library: "Bibliothek",
 movie_theater: "Kino",
 casino: "Casino",
 campground: "Camping",
 natural_feature: "Natur",
 point_of_interest: "Sehenswürdigkeit",
};

function getCategoryLabel(types: string[]): string {
 for (const type of types) {
 if (categoryMap[type]) return categoryMap[type];
 }
 return "Sehenswürdigkeit";
}

/** Unterkünfte gehören in den Hotels-Tab, nicht in Entdecken. */
function isLodgingPlace(r: { name?: string | null; types?: string[] | null }): boolean {
 const types = r.types || [];
 if (types.includes("lodging")) return true;
 const name = (r.name || "").toLowerCase();
 return /\bhotel\b|\bresort\b|\bhostel\b|\bgasthof\b|\bpension\b|\balbergo\b|\bhôtel\b/.test(
 name
 );
}

/** Google-Place-Typen passend zu den gewählten Interessen (Entdecken). */
export function googleTypesForInterests(interests?: string[]): string[] {
 const defaults = ["tourist_attraction", "museum", "park", "point_of_interest"];
 if (!interests || interests.length === 0) return defaults;

 const mapped: string[] = [];
 const add = (...types: string[]) => {
 for (const t of types) {
 if (!mapped.includes(t)) mapped.push(t);
 }
 };
 for (const interest of interests) {
 switch (interest) {
 case "kultur":
 add("museum", "church", "art_gallery", "tourist_attraction");
 break;
 case "natur":
 add("park", "natural_feature", "campground");
 break;
 case "kulinarik":
 add("restaurant", "cafe", "bar", "bakery");
 break;
 case "straende":
 add("tourist_attraction", "natural_feature", "park");
 break;
 case "fotospots":
 add("tourist_attraction", "point_of_interest", "park");
 break;
 case "familien":
 add("amusement_park", "zoo", "aquarium", "park", "museum");
 break;
 case "abenteuer":
 add("park", "natural_feature", "tourist_attraction");
 break;
 case "shopping":
 add("shopping_mall", "store", "tourist_attraction");
 break;
 default:
 break;
 }
 }
 return mapped.length > 0 ? mapped : defaults;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
 const R = 6371;
 const dLat = ((lat2 - lat1) * Math.PI) / 180;
 const dLng = ((lng2 - lng1) * Math.PI) / 180;
 const a =
 Math.sin(dLat / 2) ** 2 +
 Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
 return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function filterPoisByRadius<T extends { lat?: number; lng?: number }>(
 items: T[],
 centerLat?: number,
 centerLng?: number,
 radiusKm?: number
): T[] {
 if (centerLat == null || centerLng == null || !radiusKm) return items;
 return items.filter((item) => {
 if (item.lat == null || item.lng == null) return true;
 return haversineKm(centerLat, centerLng, item.lat, item.lng) <= radiusKm;
 });
}

export async function searchPOIs(
 destination: string,
 types: string[] = ["tourist_attraction", "museum", "park", "point_of_interest"],
 radiusKm = 25,
 center?: { lat: number; lng: number }
): Promise<POI[]> {
 if (!window.google?.maps?.places) return [];

 const radiusMeters = Math.min(Math.max(radiusKm, 1), 50) * 1000;

 const runNearbySearch = (location: google.maps.LatLng) =>
 new Promise<POI[]>((resolve) => {
 const dummyDiv = document.createElement("div");
 const service = new google.maps.places.PlacesService(dummyDiv);

 const allResults: google.maps.places.PlaceResult[] = [];
 let completed = 0;

 types.forEach((type) => {
 service.nearbySearch(
 {
 location,
 radius: radiusMeters,
 type,
 rankBy: google.maps.places.RankBy.PROMINENCE,
 },
 (results, searchStatus) => {
 completed++;
 if (
 searchStatus === google.maps.places.PlacesServiceStatus.OK &&
 results
 ) {
 allResults.push(...results);
 }
 if (completed === types.length) {
 const uniqueMap = new Map<string, google.maps.places.PlaceResult>();
 for (const r of allResults) {
 if (r.place_id && !uniqueMap.has(r.place_id)) {
 uniqueMap.set(r.place_id, r);
 }
 }

 const pois: POI[] = Array.from(uniqueMap.values())
 .filter((r) => !isLodgingPlace(r))
 .filter((r) => (r.rating ?? 0) >= 3.5 && (r.user_ratings_total ?? 0) >= 50)
 .sort(
 (a, b) =>
 (b.user_ratings_total ?? 0) * (b.rating ?? 0) -
 (a.user_ratings_total ?? 0) * (a.rating ?? 0)
 )
 .slice(0, 20)
 .map((r) => ({
 id: r.place_id || `poi_${Date.now()}_${Math.random()}`,
 name: r.name || "Unbekannt",
 category: getCategoryLabel(r.types || []),
 rating: r.rating || 0,
 totalRatings: r.user_ratings_total || 0,
 description: r.vicinity || "",
 address: r.vicinity || "",
 photoUrl: r.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 }),
 lat: r.geometry?.location?.lat() || 0,
 lng: r.geometry?.location?.lng() || 0,
 types: r.types || [],
 }));

 resolve(pois);
 }
 }
 );
 });
 });

 if (center) {
 return runNearbySearch(new google.maps.LatLng(center.lat, center.lng));
 }

 return new Promise((resolve) => {
 const geocoder = new google.maps.Geocoder();

 geocoder.geocode({ address: destination }, (results, status) => {
 if (status !== google.maps.GeocoderStatus.OK || !results?.[0]) {
 resolve([]);
 return;
 }

 const location = results[0].geometry.location;
 void runNearbySearch(location).then(resolve);
 });
 });
}

export async function searchPOIsAlongRoute(
 stopNames: string[],
 types: string[] = ["tourist_attraction", "museum", "park", "point_of_interest"],
 radiusKm = 25,
 center?: { lat: number; lng: number }
): Promise<POI[]> {
 if (!window.google?.maps?.places || stopNames.length === 0) return [];

 const uniqueNames = [...new Set(stopNames.filter((n) => n.trim()))];
 const batches = uniqueNames.slice(0, 8);

 const allPois: POI[] = [];
 for (const name of batches) {
 const pois = await searchPOIs(name, types, radiusKm, center);
 allPois.push(...pois);
 }

 const uniqueMap = new Map<string, POI>();
 for (const poi of allPois) {
 if (!uniqueMap.has(poi.id)) uniqueMap.set(poi.id, poi);
 }

 return Array.from(uniqueMap.values())
 .sort((a, b) => b.totalRatings * b.rating - a.totalRatings * a.rating)
 .slice(0, 40)
 .filter((poi) => {
 if (!center || center.lat == null || center.lng == null) return true;
 return haversineKm(center.lat, center.lng, poi.lat, poi.lng) <= radiusKm;
 });
}

export async function fetchPlacePhoto(name: string): Promise<string | null> {
 if (!window.google?.maps?.places) return null;
 return new Promise((resolve) => {
 const dummyDiv = document.createElement("div");
 const service = new google.maps.places.PlacesService(dummyDiv);
 service.findPlaceFromQuery(
 { query: name, fields: ["photos", "place_id"] },
 (results, status) => {
 if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.photos?.[0]) {
 resolve(results[0].photos[0].getUrl({ maxWidth: 400, maxHeight: 300 }));
 } else {
 resolve(null);
 }
 }
 );
 });
}

export function getPoiCategoryIcon(category: string): string {
 const iconMap: Record<string, string> = {
 "Sehenswürdigkeit": "landmark",
 Museum: "building-columns",
 Park: "trees",
 Kirche: "church",
 Galerie: "palette",
 Zoo: "paw-print",
 Aquarium: "fish",
 Freizeitpark: "ferris-wheel",
 Restaurant: "utensils",
 "Café": "coffee",
 Bar: "wine",
 Shopping: "shopping-bag",
 Natur: "mountain",
 };
 return iconMap[category] || "map-pin";
}
