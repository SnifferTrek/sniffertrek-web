export const PLAN_INTENT_KEY = "sniffertrek_plan_intent";

export function savePlanIntent(destination: string): void {
  if (typeof window === "undefined") return;
  const trimmed = destination.trim();
  if (trimmed) {
    sessionStorage.setItem(PLAN_INTENT_KEY, trimmed);
  }
}

export function readPlanIntent(): string | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(PLAN_INTENT_KEY);
  return value?.trim() || null;
}

export function clearPlanIntent(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PLAN_INTENT_KEY);
}

/** Liest und entfernt den gespeicherten Planungs-Intent. */
export function consumePlanIntent(): string | null {
  const value = readPlanIntent();
  if (value) clearPlanIntent();
  return value;
}

/** URL-Parameter für Reiseziel (optional, ergänzt sessionStorage). */
export const PLAN_DESTINATION_PARAM = "ziel";
