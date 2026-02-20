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

export async function searchPOIs(
  destination: string,
  types: string[] = ["tourist_attraction", "museum", "park", "point_of_interest"]
): Promise<POI[]> {
  if (!window.google?.maps?.places) return [];

  return new Promise((resolve) => {
    const dummyDiv = document.createElement("div");
    const service = new google.maps.places.PlacesService(dummyDiv);
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: destination }, (results, status) => {
      if (status !== google.maps.GeocoderStatus.OK || !results?.[0]) {
        resolve([]);
        return;
      }

      const location = results[0].geometry.location;

      const allResults: google.maps.places.PlaceResult[] = [];
      let completed = 0;

      types.forEach((type) => {
        service.nearbySearch(
          {
            location,
            radius: 10000,
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
  });
}

export async function searchPOIsAlongRoute(
  stopNames: string[],
  types: string[] = ["tourist_attraction", "museum", "park", "point_of_interest"]
): Promise<POI[]> {
  if (!window.google?.maps?.places || stopNames.length === 0) return [];

  const uniqueNames = [...new Set(stopNames.filter((n) => n.trim()))];
  const batches = uniqueNames.slice(0, 8);

  const allPois: POI[] = [];
  for (const name of batches) {
    const pois = await searchPOIs(name, types);
    allPois.push(...pois);
  }

  const uniqueMap = new Map<string, POI>();
  for (const poi of allPois) {
    if (!uniqueMap.has(poi.id)) uniqueMap.set(poi.id, poi);
  }

  return Array.from(uniqueMap.values())
    .sort((a, b) => b.totalRatings * b.rating - a.totalRatings * a.rating)
    .slice(0, 40);
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
