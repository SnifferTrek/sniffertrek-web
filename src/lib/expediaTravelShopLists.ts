import { buildExpediaHotelLink } from "./affiliateLinks";

export type ExpediaShopListItem = {
 id: string;
 /** In Expedia Hotel-Suche eingeben */
 expediaSearch: string;
 /** Englisch – in die Listen-Beschreibung */
 noteEn: string;
 /** Deutsch – für dich beim Kuratieren */
 noteDe: string;
};

export type ExpediaShopList = {
 id: string;
 titleEn: string;
 introEn: string;
 titleDe: string;
 introDe: string;
 items: ExpediaShopListItem[];
};

export const EXPEDIA_SHOP_LIST_END_OF_PASS: ExpediaShopList = {
 id: "end-of-pass-ch-it",
 titleEn: "End of Pass: Switzerland → Italy",
 titleDe: "End of Pass: Schweiz → Italien",
 introEn:
 "We drive Europe in multi-day loops—not fly-and-flop. These stays are where we'd actually sleep after a long alpine day: easy parking, late check-in, and a morning coffee before the next pass. No spreadsheet required—just the right bed at the right end of the road.",
 introDe:
 "Mehrtägige Roadtrips, kein Fly-and-Flop: Unterkünfte für den Abend nach Pass, See oder langem Fahrttag — Parkplatz, spätes Check-in, Kaffee vor dem nächsten Etappenstart.",
 items: [
 {
 id: "andermatt",
 expediaSearch: "Andermatt, Switzerland",
 noteEn:
 "After Grimsel or Furka: quiet alpine base with parking—fuel up for the descent into Ticino.",
 noteDe: "Nach Grimsel/Furka: ruhige Alpenbasis mit Parkplatz.",
 },
 {
 id: "bissone",
 expediaSearch: "Bissone, Switzerland",
 noteEn:
 "Lake Lugano instead of another tunnel—promenade walk after 300 km of driving.",
 noteDe: "Luganer See statt weiterem Tunnel — Promenade nach langem Fahrtag.",
 },
 {
 id: "bellinzona",
 expediaSearch: "Bellinzona, Switzerland",
 noteEn:
 "Castles at dusk, car still packed for tomorrow—cheaper than lakeside glamour.",
 noteDe: "Burgen am Abend, Auto bleibt gepackt — oft günstiger als am See.",
 },
 {
 id: "menaggio",
 expediaSearch: "Menaggio, Lake Como, Italy",
 noteEn:
 "First real Italian espresso stop—hotel with parking, not pedestrian-only old town.",
 noteDe: "Erster «richtiger» Italien-Stopp — Hotel mit Parkplatz am Comer See.",
 },
 {
 id: "mestre",
 expediaSearch: "Mestre, Venice, Italy",
 noteEn:
 "Park the car, train to Venice for two nights—your shoulders will thank you.",
 noteDe: "Auto abstellen, Zug nach Venedig — kein Rollkoffer-Marathon.",
 },
 ],
};

export const EXPEDIA_SHOP_LIST_VENICE: ExpediaShopList = {
 id: "venice-no-suitcase",
 titleEn: "Venice: Sleep Smart, Walk Slow",
 titleDe: "Venedig: Schlau schlafen, langsam laufen",
 introEn:
 "Venice punishes rolling luggage. We only recommend stays where the last 200 meters are manageable—or where you leave the car on the mainland and still feel like you're in the trip.",
 introDe:
 "Venedig bestraft Rollkoffer. Nur Hotels, bei denen die letzten 200 Meter machbar sind — oder Festland mit guter Anbindung.",
 items: [
 {
 id: "giorgione",
 expediaSearch: "Hotel Giorgione, Venice, Italy",
 noteEn: "Cannaregio calm—bridges, but no suitcase marathon from the station.",
 noteDe: "Ruhiges Cannaregio — authentischer als San Marco.",
 },
 {
 id: "antiche-figure",
 expediaSearch: "Hotel Antiche Figure, Venice, Italy",
 noteEn: "Near Santa Lucia—arrival day sanity with luggage.",
 noteDe: "Nahe Bahnhof Santa Lucia — praktisch bei Ankunft.",
 },
 {
 id: "generator",
 expediaSearch: "Generator Venice, Italy",
 noteEn: "Budget on Giudecca—factor in the vaporetto commute.",
 noteDe: "Giudecca, günstiger — Vaporetto einplanen.",
 },
 {
 id: "molino-stucky",
 expediaSearch: "Hilton Molino Stucky Venice, Italy",
 noteEn: "Giudecca skyline and shuttle boat—space after crowded days.",
 noteDe: "Giudecca mit Shuttle-Boot — Ruhe nach San Marco.",
 },
 {
 id: "mestre-venice",
 expediaSearch: "Mestre, Venice, Italy",
 noteEn: "The plot twist that saves your back and your budget—train in, walk slow.",
 noteDe: "Festland-Trick: günstiger, aber mindestens 2 Nächte in der Lagune lohnen.",
 },
 ],
};

export const EXPEDIA_SHOP_LISTS = [EXPEDIA_SHOP_LIST_END_OF_PASS, EXPEDIA_SHOP_LIST_VENICE];

const DEFAULT_TRAVELERS = 2;
const DEFAULT_ROOMS = 1;

function defaultHotelDates(): { checkIn: string; checkOut: string } {
 const checkIn = new Date();
 checkIn.setHours(12, 0, 0, 0);
 checkIn.setDate(checkIn.getDate() + 14);
 const checkOut = new Date(checkIn);
 checkOut.setDate(checkOut.getDate() + 2);
 return {
 checkIn: checkIn.toISOString().slice(0, 10),
 checkOut: checkOut.toISOString().slice(0, 10),
 };
}

export function buildExpediaShopHotelLink(
 item: ExpediaShopListItem,
 listId: string
): string {
 const { checkIn, checkOut } = defaultHotelDates();
 return buildExpediaHotelLink({
 destination: item.expediaSearch,
 checkIn,
 checkOut,
 travelers: DEFAULT_TRAVELERS,
 rooms: DEFAULT_ROOMS,
 clickRef: `expedia-shop-${listId}-${item.id}`,
 });
}

export const EXPEDIA_SHOP_SHARE_BLURB = `Not bucket-list hotels. End-of-day hotels.
For couples who drive Europe and want the right bed after the pass — curated on Expedia.`;
