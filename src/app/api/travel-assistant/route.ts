import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { loadAirportCatalog, type AirportRecord } from "@/lib/airportMatch";
import {
  enrichModulesFromConversation,
  finalizeAssistantReply,
  getForcedNextQuestion,
  inferRelatedReport,
  isDraftReadyForPlaner,
  isMetaAssistantQuestion,
  replyAddressesForcedQuestion,
  reconcileAssistantReply,
  resolveDraftDatesFromConversation,
  resolveLocalCarPreference,
  todayIsoDate,
  travelAssistantSystemPrompt,
  travelAssistantTodayMessage,
  withInferredPlaces,
  withMetaPlanningHandoff,
  withParsedRouteStops,
  type TravelAssistantDraft,
  type TravelAssistantMessage,
} from "@/lib/travelAssistant";
import { asAppLocale } from "@/lib/localeCopy";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function extractJsonObject(text: string): unknown | null {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const messages = (body?.messages || []) as TravelAssistantMessage[];
    const draft = (body?.draft || {}) as TravelAssistantDraft;
    const locale = asAppLocale(typeof body?.locale === "string" ? body.locale : "de");

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Missing messages" }, { status: 400 });
    }

    const safeMessages = messages
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim()
      )
      .slice(-16)
      .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 2000) }));

    if (safeMessages.length === 0) {
      return NextResponse.json({ error: "Missing messages" }, { status: 400 });
    }

    await loadAirportCatalog(async () => {
      const raw = await readFile(
        path.join(process.cwd(), "public/data/airports.json"),
        "utf8"
      );
      return JSON.parse(raw) as AirportRecord[];
    });

    const today = todayIsoDate();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 700,
        messages: [
          { role: "system", content: travelAssistantSystemPrompt(locale) },
          {
            role: "system",
            content: travelAssistantTodayMessage(today, draft, locale),
          },
          ...safeMessages,
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `OpenAI Fehler ${response.status}: ${errText.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const raw = (data?.choices?.[0]?.message?.content || "").toString();
    const parsed = extractJsonObject(raw) as {
      reply?: string;
      draft?: TravelAssistantDraft;
      ready?: boolean;
      tips?: string[];
    } | null;

    if (!parsed?.reply) {
      return NextResponse.json(
        { error: "Ungültige Assistenten-Antwort" },
        { status: 502 }
      );
    }

    const conversationText = safeMessages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join("\n");
    const lastAssistantReply =
      [...safeMessages].reverse().find((m) => m.role === "assistant")?.content ||
      "";

    const rawDraft = (parsed.draft || {}) as TravelAssistantDraft;
    // localCar nur aus Chat + bereits bestätigtem Draft – KI darf nicht „raten“
    const localCar = resolveLocalCarPreference(
      {
        ...draft,
        ...rawDraft,
        localCar:
          draft.localCar === true || draft.localCar === false
            ? draft.localCar
            : null,
      },
      conversationText,
      lastAssistantReply
    );

    let nextDraft: TravelAssistantDraft = {
      ...rawDraft,
      // KI-Startort nicht übernehmen (ausser Freitext-Route setzt ihn später)
      startPlace: draft.startPlace ?? null,
      localCar,
      routeStops: rawDraft.routeStops?.length
        ? rawDraft.routeStops
        : draft.routeStops || null,
      relatedReport:
        rawDraft.relatedReport ||
        draft.relatedReport ||
        inferRelatedReport(conversationText) ||
        null,
    };
    nextDraft = withParsedRouteStops(nextDraft, conversationText);
    nextDraft = withInferredPlaces(
      resolveDraftDatesFromConversation(nextDraft, conversationText),
      conversationText,
      lastAssistantReply
    );
    nextDraft.localCar =
      resolveLocalCarPreference(
        nextDraft,
        conversationText,
        lastAssistantReply
      ) ??
      nextDraft.localCar ??
      null;
    nextDraft.modules = enrichModulesFromConversation(
      rawDraft.modules ?? draft.modules,
      conversationText,
      {
        localCar: nextDraft.localCar,
        startPlace: nextDraft.startPlace,
        destination: nextDraft.destination,
        endPlace: nextDraft.endPlace,
      },
      lastAssistantReply
    );

    let replyRaw = String(parsed.reply).trim();
    const forced = getForcedNextQuestion(
      nextDraft,
      conversationText,
      lastAssistantReply,
      locale
    );
    let ready = !forced && isDraftReadyForPlaner(
      nextDraft,
      replyRaw,
      conversationText,
      lastAssistantReply
    );

    if (forced) {
      ready = false;
      const meta = isMetaAssistantQuestion(conversationText);
      if (
        !meta &&
        (!replyAddressesForcedQuestion(replyRaw, forced) ||
          Boolean(parsed.ready))
      ) {
        replyRaw = forced;
      }
    }

    replyRaw = withMetaPlanningHandoff(replyRaw, conversationText, forced, locale);
    replyRaw = reconcileAssistantReply(
      replyRaw,
      nextDraft,
      conversationText,
      lastAssistantReply,
      ready,
      locale
    );
    const reply = finalizeAssistantReply(replyRaw, ready, locale);

    return NextResponse.json({
      reply,
      draft: nextDraft,
      ready,
      tips: Array.isArray(parsed.tips)
        ? parsed.tips.map((t) => String(t)).slice(0, 5)
        : [],
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
