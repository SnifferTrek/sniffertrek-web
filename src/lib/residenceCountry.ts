export type ResidenceCountry = "DE" | "AT" | "CH";

export const RESIDENCE_COUNTRY_META_KEY = "residence_country";

export const RESIDENCE_COUNTRY_OPTIONS: {
 value: ResidenceCountry;
 label: string;
 flag: string;
}[] = [
 { value: "DE", label: "Deutschland", flag: "🇩🇪" },
 { value: "AT", label: "Österreich", flag: "🇦🇹" },
 { value: "CH", label: "Schweiz", flag: "🇨🇭" },
];

export const INSURANCE_COUNTRY_LABELS: Record<ResidenceCountry, string> = {
 DE: "Deutschland",
 AT: "Österreich",
 CH: "Schweiz",
};

export function isResidenceCountry(value: unknown): value is ResidenceCountry {
 return value === "DE" || value === "AT" || value === "CH";
}

export function parseResidenceCountry(value: unknown): ResidenceCountry | null {
 return isResidenceCountry(value) ? value : null;
}

/** Versicherungs-Anbieter: eingeloggt = Wohnsitz; ohne Login immer DE. */
export function resolveInsuranceCountry(
 user: { residenceCountry?: ResidenceCountry | null } | null
): ResidenceCountry {
 if (user?.residenceCountry) return user.residenceCountry;
 return "DE";
}
