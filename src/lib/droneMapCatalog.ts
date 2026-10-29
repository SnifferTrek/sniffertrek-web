/**
 * Offizielle bzw. flugbehördliche Portale zu Drohnen (Karten, Regeln).
 * Links können sich ändern — bei Meldungen anpassen.
 */

export type DroneMapItem = {
 region: string;
 /** Anzeige & Gruppierung (z. B. Land oder „EU (EASA)“) */
 country: string;
 name: string;
 desc: string;
 link: string;
 /** Niedrig = weiter oben in der Liste */
 sortPriority?: number;
};

export const DRONE_MAP_ITEMS: DroneMapItem[] = [
 {
 region: "Europa",
 country: "EU (EASA)",
 name: "EASA Civil Drones",
 desc: "EU-Drohnenverordnung, Kategorien, nationale Umsetzung (Verlinkung zu Behörden)",
 link: "https://www.easa.europa.eu/en/domains/civil-drones/drone-regulations",
 sortPriority: 0,
 },
 {
 region: "Europa",
 country: "Belgien",
 name: "Belgium Drone Guide",
 desc: "Regeln und Luftzonen-Infos",
 link: "https://mobilit.belgium.be/en/air/air_traffic/drones",
 },
 {
 region: "Europa",
 country: "Dänemark",
 name: "Trafikstyrelsen – Drohnen",
 desc: "Dänische Verkehrsbehörde, Regeln und Hinweise zum Luftraum",
 link: "https://www.trafikstyrelsen.dk/en/transport-permit/air-traffic/drones",
 },
 {
 region: "Europa",
 country: "Deutschland",
 name: "DIPUL Map Tool",
 desc: "Offizielles UAS-Flugzonenportal (DFS)",
 link: "https://maptool-dipul.dfs.de/",
 },
 {
 region: "Europa",
 country: "Finnland",
 name: "Drone Info (Trafi)",
 desc: "Karte und Regeln zu Drohnen (Traficom)",
 link: "https://www.droneinfo.fi/en/",
 },
 {
 region: "Europa",
 country: "Frankreich",
 name: "Geoportail Drones",
 desc: "Karte mit Drohnen-Einschränkungen",
 link: "https://www.geoportail.gouv.fr/donnees/restrictions-pour-drones-de-loisir",
 },
 {
 region: "Europa",
 country: "Griechenland",
 name: "DAGR (Drone Aware GR)",
 desc: "Offizielle UAS-Geozonenkarte (HCAA / HASP)",
 link: "https://dagr.hcaa.gr/",
 },
 {
 region: "Europa",
 country: "Irland",
 name: "IAA Drones",
 desc: "Irische Luftfahrtbehörde – Drohnenregeln und -register",
 link: "https://www.iaa.ie/general-aviation/drones",
 },
 {
 region: "Europa",
 country: "Italien",
 name: "D-Flight",
 desc: "UAS-Registrierung und Kartenportal",
 link: "https://www.d-flight.it/web-app/",
 },
 {
 region: "Europa",
 country: "Kroatien",
 name: "CCAA – UAS / Drohnen",
 desc: "Hrvatska agencija za civilno zrakoplovstvo (Zuständigkeit UAS)",
 link: "https://www.ccaa.hr/hr/dronovi-bespilotne-zracne-plovila-uas/",
 },
 {
 region: "Europa",
 country: "Luxemburg",
 name: "DAC – Aviation civile",
 desc: "Direction de l’aviation civile (Hinweise zu Drohnen / Verboten)",
 link: "https://dac.public.lu/",
 },
 {
 region: "Europa",
 country: "Niederlande",
 name: "GoDrone",
 desc: "Luftraumkarte und Flugregeln",
 link: "https://www.godrone.nl/",
 },
 {
 region: "Europa",
 country: "Norwegen",
 name: "Luftfartstilsynet – Drones",
 desc: "Norwegische Aufsicht – Regeln und Gebiete",
 link: "https://luftfartstilsynet.no/en/drones/",
 },
 {
 region: "Europa",
 country: "Österreich",
 name: "Drone Space",
 desc: "Austro Control Flugzonenkarte",
 link: "https://map.dronespace.at/",
 },
 {
 region: "Europa",
 country: "Polen",
 name: "PANSA DroneMap",
 desc: "Offizielle Gebietskarte für unbemannte Luftfahrzeuge",
 link: "https://dronemap.pansa.pl/",
 },
 {
 region: "Europa",
 country: "Portugal",
 name: "ANAC DNT Map",
 desc: "Interaktive UAS-Geozonenkarte (Portugal)",
 link: "https://dnt.anac.pt/",
 },
 {
 region: "Europa",
 country: "Schweden",
 name: "Transportstyrelsen – Dronare",
 desc: "Schwedische Verkehrsbehörde – Drohnenbetrieb und Kartenhinweise",
 link: "https://www.transportstyrelsen.se/en/aviation/drones/",
 },
 {
 region: "Europa",
 country: "Schweiz",
 name: "FOCA Drone Map",
 desc: "BAZL-Karte für Drohnenzonen",
 link: "https://map.geo.admin.ch/#/map?lang=de&topic=aviation&layers=ch.bazl.einschraenkungen-drohnen",
 },
 {
 region: "Europa",
 country: "Slowakei",
 name: "ULIS GIS",
 desc: "UAS-Karte und Registrierung (ÚCL)",
 link: "https://gis.ulis.sk/",
 },
 {
 region: "Europa",
 country: "Slowenien",
 name: "CAA Slovenia – UAS",
 desc: "Geografische Einschränkungen und 2D-Karten (Behörde)",
 link: "https://www.caa.si/en/geographical-restrictions-for-uas.html",
 },
 {
 region: "Europa",
 country: "Spanien",
 name: "ENAIRE Drones",
 desc: "Offizielle UAS-Karte für Spanien",
 link: "https://drones.enaire.es/",
 },
 {
 region: "Europa",
 country: "Tschechien",
 name: "DroneMap (CAA CZ)",
 desc: "Digitale Karte der Gebietszonen (ÚCL / Änderungen beachten)",
 link: "https://dronemap.gov.cz/index.php?lang=2",
 },
 {
 region: "Europa",
 country: "Albanien",
 name: "AAC – Drohnen",
 desc: "Albanische Zivilluftfahrtbehörde (UAS / Registrierung)",
 link: "https://www.aac.gov.al/avione-pa-pilote-drone/",
 },
 {
 region: "Europa",
 country: "Andorra",
 name: "Govern – unbemannte Luftfahrzeuge",
 desc: "Amtliche Anträge und Hinweise (Regierung)",
 link: "https://www.e-tramits.ad/tramits/ca/aeronaus-no-tripulades/p/GV000310",
 },
 {
 region: "Europa",
 country: "Bosnien und Herzegowina",
 name: "BHDCA – Drohnen",
 desc: "Direktorat Zivilluftfahrt BiH – Regeln und Infos",
 link: "https://www.bhdca.gov.ba/index.php/en/drone",
 },
 {
 region: "Europa",
 country: "Bulgarien",
 name: "CAA Bulgaria – Drones",
 desc: "Registrierung, Geozonen, interaktive Karte (GVA)",
 link: "https://drones.caa.bg/en/our-service",
 },
 {
 region: "Europa",
 country: "Estland",
 name: "Transpordiamet – Drones",
 desc: "Transportverwaltung: Regeln, LOIS, Gebietszonen",
 link: "https://transpordiamet.ee/en/drones",
 },
 {
 region: "Europa",
 country: "Island",
 name: "Samgöngustofa – Unmanned aircraft",
 desc: "Isländische Transportbehörde (EU-konforme Regeln)",
 link: "https://www.samgongustofa.is/en/air/unmanned-aircraft",
 },
 {
 region: "Europa",
 country: "Kosovo",
 name: "CAA Kosovo – RPAS",
 desc: "Zivilluftfahrt: Genehmigungen und Vorschriften UAS",
 link: "https://caa.rks-gov.net/en/rpas/",
 },
 {
 region: "Europa",
 country: "Lettland",
 name: "CAA Latvia – Droni",
 desc: "UASIS, Geozonen, Registrierung",
 link: "https://droni.caa.gov.lv/en/",
 },
 {
 region: "Europa",
 country: "Liechtenstein",
 name: "LLV – Zivilluftfahrt",
 desc: "Koordination; massgebend oft schweizerisches Recht / BAZL",
 link: "https://www.llv.li/en/national-administration/office-of-building-construction-and-spatial-planning/civil-aviation",
 },
 {
 region: "Europa",
 country: "Litauen",
 name: "Lithuania Drone Map (ANS)",
 desc: "Amtliche Karte / UTM (Oro navigacija)",
 link: "https://utm.ans.lt/avm/",
 },
 {
 region: "Europa",
 country: "Malta",
 name: "Transport Malta – Drones",
 desc: "Civil Aviation Directorate: Regeln, Zonen, LUC",
 link: "https://www.transport.gov.mt/aviation/drones-4444",
 },
 {
 region: "Europa",
 country: "Moldau",
 name: "CAA Moldova – UAS",
 desc: "Zivilluftfahrtbehörde Republik Moldau",
 link: "https://caa.md/en/unmanned-aircraft-uauas",
 },
 {
 region: "Europa",
 country: "Monaco",
 name: "Monaco – Drohnenbewilligung",
 desc: "Amtliche Erlaubnis für ferngesteuerte Luftfahrzeuge (Guichet Entreprises)",
 link: "https://monentreprise.gouv.mc/en/themes/sector-specific-or-regulated-activities/specific-authorisations/communications-and-media/how-to-apply-for-approval-to-operate-drones",
 },
 {
 region: "Europa",
 country: "Montenegro",
 name: "CAA Montenegro – UAS",
 desc: "Registrierung und unbemannte Luftfahrzeuge",
 link: "https://caa.me/en/flight-operations-unmanned-aircraft",
 },
 {
 region: "Europa",
 country: "Nordmazedonien",
 name: "CAA NM – drone.gov.mk",
 desc: "Portal: Registrierung, Prüfungen, Flugmeldung",
 link: "https://drone.gov.mk/",
 },
 {
 region: "Europa",
 country: "Rumänien",
 name: "AACR – Drone",
 desc: "Rumänische Luftfahrtbehörde (UAS, Zonen)",
 link: "https://www.caa.ro/en/pages/drone",
 },
 {
 region: "Europa",
 country: "San Marino",
 name: "CAMA – RPAS",
 desc: "Zivilluftfahrt- und Schifffahrtsbehörde",
 link: "https://www.caa-mna.sm/rpas",
 },
 {
 region: "Europa",
 country: "Serbien",
 name: "CAD Serbia – Unmanned aircraft",
 desc: "Direktorat Zivilluftfahrt, Genehmigungen und Register",
 link: "https://cad.gov.rs/strana/23311/unmanned-aircraft?lang=en",
 },
 {
 region: "Europa",
 country: "Ungarn",
 name: "Közlekedési Hatóság – UAS",
 desc: "Pilotenlose Luftfahrzeuge (behördliche Zuständigkeit)",
 link: "https://kozlekedesihatosag.kormany.hu/hu/pil%C3%B3ta-n%C3%A9lk%C3%BCli-l%C3%A9gij%C3%A1rm%C5%B1-oszt%C3%A1ly",
 },
 {
 region: "Europa",
 country: "Ukraine",
 name: "Derzhaviaseluzhba (SAAU)",
 desc: "Staatlicher Luftraum / Zivilluftfahrt Ukraine (Luftraum stark eingeschränkt)",
 link: "https://avia.gov.ua/",
 },
 {
 region: "Europa",
 country: "Zypern",
 name: "Cyprus Drones (DCA)",
 desc: "Department of Civil Aviation: Regeln, Geozonen",
 link: "https://drones.gov.cy/",
 },
 {
 region: "Europa",
 country: "Belarus",
 name: "UAS.gov.by",
 desc: "Registrierung unbemannte Luftfahrzeuge (Amtssystem)",
 link: "https://uas.gov.by/",
 },
 {
 region: "Europa",
 country: "Georgien",
 name: "GCAA – UAS",
 desc: "Georgische Zivilluftfahrtagentur, Registrierung & Regeln",
 link: "https://uas.gov.ge/EN",
 },
 {
 region: "Europa",
 country: "Türkei",
 name: "SHGM – İHA",
 desc: "Generaldirektion Zivilluftfahrt: Drohnenregistrierung & Vorschriften",
 link: "https://iha.shgm.gov.tr/",
 },
 {
 region: "Europa",
 country: "UK",
 name: "CAA Drone Assist",
 desc: "UK Flugzonen und Regel-Info",
 link: "https://register-drones.caa.co.uk/drone-code/where-you-can-fly",
 },
];

export function groupDroneMapItemsByRegion(
 items: DroneMapItem[],
 regionOrder: string[] = ["Europa"]
): { region: string; items: DroneMapItem[] }[] {
 const byRegion = new globalThis.Map<string, DroneMapItem[]>();
 for (const item of items) {
 const list = byRegion.get(item.region) ?? [];
 list.push(item);
 byRegion.set(item.region, list);
 }
 for (const list of byRegion.values()) {
 list.sort((a, b) => {
 const pa = a.sortPriority ?? 100;
 const pb = b.sortPriority ?? 100;
 if (pa !== pb) return pa - pb;
 return a.country.localeCompare(b.country, "de");
 });
 }
 const keys = Array.from(byRegion.keys()).sort((a, b) => {
 const ia = regionOrder.indexOf(a);
 const ib = regionOrder.indexOf(b);
 if (ia !== -1 && ib !== -1) return ia - ib;
 if (ia !== -1) return -1;
 if (ib !== -1) return 1;
 return a.localeCompare(b, "de");
 });
 return keys.map((region) => ({ region, items: byRegion.get(region)! }));
}
