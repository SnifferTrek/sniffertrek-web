import type { Metadata } from "next";
import PlanningDemo from "./PlanningDemo";

export const metadata: Metadata = {
  title: "Planungsübersicht ausprobieren | SnifferTrek",
  description: "Eine interaktive Vorschau: von der Reiseidee zum persönlichen Reiseplan.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.sniffertrek.com/v2/planung-test" },
};

export default function Page() {
  return <PlanningDemo />;
}
