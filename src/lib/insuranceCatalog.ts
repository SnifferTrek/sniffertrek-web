import {
 buildAllianzTravelAtLink,
 buildAllianzTravelChLink,
 buildAllianzTravelLink,
 buildCheck24ReiseversicherungAtLink,
 buildCheck24ReiseversicherungLink,
 buildComparisReiseversicherungLink,
 buildErgoReiseversicherungLink,
 buildErvReiseversicherungLink,
 buildGeneraliReiseversicherungAtLink,
 buildHanseMerkurReiseLink,
 buildHelvetiaReiseversicherungLink,
 buildUniqaReiseversicherungAtLink,
 buildWorldNomadsLink,
} from "@/lib/affiliateLinks";
import type { ResidenceCountry } from "@/lib/residenceCountry";

export type InsuranceProviderCard = {
 name: string;
 desc: string;
 features: string[];
 color: string;
 bg: string;
 link: string;
};

const DE_PROVIDERS: InsuranceProviderCard[] = [
 {
 name: "Allianz Reiseversicherung",
 desc: "Rücktritt, Auslandskranken & Pakete – online berechnen",
 features: ["Reiserücktritt", "Krankenversicherung", "Jahrestarif"],
 color: "text-[var(--st-primary-hover)]",
 bg: "bg-blue-50",
 link: buildAllianzTravelLink(),
 },
 {
 name: "CHECK24 Reiseversicherung",
 desc: "Tarifvergleich & Abschluss für Wohnsitz Deutschland",
 features: ["Vergleichsrechner", "Online abschließen", "Viele Anbieter"],
 color: "text-orange-800",
 bg: "bg-orange-50",
 link: buildCheck24ReiseversicherungLink(),
 },
 {
 name: "ERGO Reiseversicherung",
 desc: "Beitragsrechner für Storno, Ausland & Komplettschutz",
 features: ["Familientarife", "Jahresschutz", "RundumSorglos"],
 color: "text-red-700",
 bg: "bg-red-50",
 link: buildErgoReiseversicherungLink(),
 },
 {
 name: "HanseMerkur Reise",
 desc: "Reiseversicherung direkt online buchen (hmrv.de)",
 features: ["Rücktritt", "Auslandskranken", "Sofort-Police"],
 color: "text-teal-800",
 bg: "bg-teal-50",
 link: buildHanseMerkurReiseLink(),
 },
 {
 name: "World Nomads",
 desc: "Reiseversicherung-Angebot für Abenteurer (EU)",
 features: ["Outdoor-Aktivitäten", "Online Quote", "Weltweit"],
 color: "text-green-700",
 bg: "bg-green-50",
 link: buildWorldNomadsLink(),
 },
];

const AT_PROVIDERS: InsuranceProviderCard[] = [
 {
 name: "CHECK24 Reiseversicherung",
 desc: "Reiseversicherungs-Vergleich für Österreich",
 features: ["Vergleichsrechner", "Online abschließen", "Storno & Kranken"],
 color: "text-orange-800",
 bg: "bg-orange-50",
 link: buildCheck24ReiseversicherungAtLink(),
 },
 {
 name: "Allianz Travel Österreich",
 desc: "Reiseversicherungen online abschließen",
 features: ["Storno & Abbruch", "Auslandskranken", "Jahresoption"],
 color: "text-[var(--st-primary-hover)]",
 bg: "bg-blue-50",
 link: buildAllianzTravelAtLink(),
 },
 {
 name: "Europäische Reiseversicherung",
 desc: "Komplettschutz (Generali-Partner) – Prämie & Abschluss",
 features: ["Storno", "Auslandskranken", "24h-Notruf"],
 color: "text-red-700",
 bg: "bg-red-50",
 link: buildGeneraliReiseversicherungAtLink(),
 },
 {
 name: "UNIQA Reiseversicherung",
 desc: "Online-Rechner – sofort versichert",
 features: ["Annullation", "Assistance", "Familientarife"],
 color: "text-indigo-800",
 bg: "bg-indigo-50",
 link: buildUniqaReiseversicherungAtLink(),
 },
 {
 name: "World Nomads",
 desc: "Reiseversicherung-Angebot berechnen (EU)",
 features: ["Outdoor-Aktivitäten", "Online Quote", "Weltweit"],
 color: "text-green-700",
 bg: "bg-green-50",
 link: buildWorldNomadsLink(),
 },
];

const CH_PROVIDERS: InsuranceProviderCard[] = [
 {
 name: "Comparis Reiseversicherung",
 desc: "Prämien & Leistungen von Jahresversicherungen vergleichen",
 features: ["CH-Anbieter", "Einzel & Familie", "Vergleich"],
 color: "text-sky-800",
 bg: "bg-sky-50",
 link: buildComparisReiseversicherungLink(),
 },
 {
 name: "Allianz Travel Schweiz",
 desc: "Einzelreise & Jahresversicherung – Prämie berechnen",
 features: ["Annullation", "Assistance", "Online abschließen"],
 color: "text-[var(--st-primary-hover)]",
 bg: "bg-blue-50",
 link: buildAllianzTravelChLink(),
 },
 {
 name: "Helvetia Reiseversicherung",
 desc: "Annullation & Assistance – Prämie online berechnen",
 features: ["Modular", "Kombi-Rabatt", "CH-Wohnsitz"],
 color: "text-rose-800",
 bg: "bg-rose-50",
 link: buildHelvetiaReiseversicherungLink(),
 },
 {
 name: "ERV Single Trip",
 desc: "Reiseversicherung für eine Reise – jetzt abschliessen",
 features: ["Annullation", "Assistance", "Online-Police"],
 color: "text-emerald-800",
 bg: "bg-emerald-50",
 link: buildErvReiseversicherungLink(),
 },
];

export function getInsuranceProviders(
 country: ResidenceCountry
): InsuranceProviderCard[] {
 switch (country) {
 case "AT":
 return AT_PROVIDERS;
 case "CH":
 return CH_PROVIDERS;
 default:
 return DE_PROVIDERS;
 }
}

export function getInsuranceIntro(country: ResidenceCountry, loggedIn: boolean): string {
 const region = country === "DE" ? "Deutschland" : country === "AT" ? "Österreich" : "Schweiz";
 if (loggedIn) {
 return `Direktlinks zu Reiseversicherungs-Rechnern und Abschlussseiten für ${region}. Reiserücktritt, Krankenversicherung und Gepäck – passend zu deinem Wohnsitz.`;
 }
 return `Reiseversicherungs-Rechner für ${region} (Standard ohne Anmeldung: Deutschland). Nach der Registrierung mit Wohnsitz siehst du nur Angebote für dein Land.`;
}
