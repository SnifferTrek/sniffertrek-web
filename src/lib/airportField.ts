/** IATA aus AirportSelect-Wert, z. B. „Zürich (ZRH)“ oder „ZRH“. */
export function extractIataFromAirportField(value: string): string {
 const v = (value || "").trim();
 const paren = v.match(/\(([A-Za-z]{3})\)\s*$/);
 if (paren) return paren[1].toUpperCase();
 if (/^[A-Za-z]{3}$/.test(v)) return v.toUpperCase();
 return "";
}
