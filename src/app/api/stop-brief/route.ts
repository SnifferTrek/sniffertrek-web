import { NextRequest, NextResponse } from "next/server";
import {
  fetchStopBrief,
  fetchStopBriefPhoto,
  wikiImageDedupeKey,
} from "@/lib/stopBriefFetch";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = (body?.name || "").toString().trim();
    if (!name) {
      return NextResponse.json({ error: "Missing place name" }, { status: 400 });
    }
    const lat = typeof body?.lat === "number" ? body.lat : undefined;
    const lng = typeof body?.lng === "number" ? body.lng : undefined;
    const language = (body?.language || "de").toString();
    const photoMode = body?.photoMode as "reload" | "alternate" | undefined;

    if (photoMode === "reload" || photoMode === "alternate") {
      const currentPhotoUrl = (body?.currentPhotoUrl || "").toString().trim() || undefined;
      const result = await fetchStopBriefPhoto({
        name,
        wikipediaTitle: (body?.wikipediaTitle || "").toString() || undefined,
        lat: typeof body?.lat === "number" ? body.lat : undefined,
        lng: typeof body?.lng === "number" ? body.lng : undefined,
        language,
        variantIndex:
          typeof body?.variantIndex === "number" ? body.variantIndex : undefined,
        currentPhotoUrl,
        mode: photoMode,
      });
      const sameAsCurrent =
        !!currentPhotoUrl &&
        !!result.photoUrl &&
        wikiImageDedupeKey(currentPhotoUrl) === wikiImageDedupeKey(result.photoUrl);
      if (!result.photoUrl || (photoMode === "alternate" && sameAsCurrent)) {
        return NextResponse.json(
          { error: "Kein weiteres Bild gefunden.", ...result },
          { status: 404 },
        );
      }
      return NextResponse.json(result);
    }

    const result = await fetchStopBrief({ name, lat, lng, language });
    if (!result.description && result.source === "none") {
      return NextResponse.json(
        {
          error:
            "Kein Wikipedia-Artikel (DE) gefunden – es wird kein freier KI-Text erzeugt. Bitte Text selbst eingeben oder anderen Stoppnamen wählen.",
          description: "",
          source: "none",
        },
        { status: 404 },
      );
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
