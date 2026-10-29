"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Loader2, MessageCircle, Sparkles, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useTravelAssistant } from "@/components/TravelAssistantContext";
import { loadAirportCatalog, type AirportRecord } from "@/lib/airportMatch";
import {
  applyDraftToTrip,
  draftSummaryLine,
  finalizeAssistantReply,
  getCoteDazurAssistantDemo,
  getForcedNextQuestion,
  inferRelatedReport,
  isDraftReadyForPlaner,
  isMetaAssistantQuestion,
  mergeAssistantDraft,
  replyAddressesForcedQuestion,
  reconcileAssistantReply,
  withMetaPlanningHandoff,
  TRAVEL_ASSISTANT_WELCOME,
  type TravelAssistantDraft,
  type TravelAssistantMessage,
} from "@/lib/travelAssistant";
import {
  createNewTrip,
  getAllTrips,
  saveTrip,
  setActiveTripId,
} from "@/lib/tripStorage";

const WELCOME = TRAVEL_ASSISTANT_WELCOME;

type ChatRow = TravelAssistantMessage & { tips?: string[] };

export default function TravelAssistantChat() {
  const t = useTranslations("assistant");
  const locale = useLocale();
  const { open, closeAssistant, openAssistant, pendingDemo, clearPendingDemo } =
    useTravelAssistant();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatRow[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [draft, setDraft] = useState<TravelAssistantDraft>({});
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [loginHint, setLoginHint] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const loadCoteDemo = () => {
    const demo = getCoteDazurAssistantDemo(new Date(), locale);
    setMessages(demo.messages);
    setDraft(demo.draft);
    setReady(true);
    setInput("");
    setError("");
    setLoginHint(false);
  };

  useEffect(() => {
    void loadAirportCatalog(async () => {
      const res = await fetch("/data/airports.json");
      return (await res.json()) as AirportRecord[];
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, ready, loginHint]);

  useEffect(() => {
    if (!open || !pendingDemo) return;
    if (pendingDemo === "cote-dazur") loadCoteDemo();
    clearPendingDemo();
  }, [open, pendingDemo, clearPendingDemo]);

  const resetChat = () => {
    setMessages([{ role: "assistant", content: WELCOME }]);
    setDraft({});
    setReady(false);
    setInput("");
    setError("");
    setLoginHint(false);
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;

    await loadAirportCatalog(async () => {
      const res = await fetch("/data/airports.json");
      return (await res.json()) as AirportRecord[];
    });

    const nextMessages: ChatRow[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/travel-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content: c }) => ({ role, content: c })),
          draft,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || t("error"));
      }

      const conversationText = nextMessages
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .join("\n");
      // Letzte Assistenten-Frage VOR der aktuellen Nutzerantwort (für Ja/Nein Mietwagen)
      const lastAssistantReply =
        [...messages].reverse().find((m) => m.role === "assistant")?.content ||
        "";
      const merged = mergeAssistantDraft(
        draft,
        data.draft,
        conversationText,
        lastAssistantReply
      );
      let replyText =
        String(data.reply || "").trim() || t("emptyReply");
      const forced = getForcedNextQuestion(
        merged,
        conversationText,
        lastAssistantReply,
        locale
      );
      let nextReady =
        !forced &&
        isDraftReadyForPlaner(
          merged,
          replyText,
          conversationText,
          lastAssistantReply
        );

      if (forced) {
        nextReady = false;
        const meta = isMetaAssistantQuestion(conversationText);
        if (
          !meta &&
          (!replyAddressesForcedQuestion(replyText, forced) ||
            Boolean(data.ready))
        ) {
          replyText = forced;
        }
      }

      replyText = withMetaPlanningHandoff(
        replyText,
        conversationText,
        forced,
        locale
      );
      replyText = reconcileAssistantReply(
        replyText,
        merged,
        conversationText,
        lastAssistantReply,
        nextReady,
        locale
      );
      const reply = finalizeAssistantReply(replyText, nextReady, locale);
      setDraft(merged);
      setReady(nextReady);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
          tips: Array.isArray(data.tips) ? data.tips : [],
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"));
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t("errorFallback"),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const conversationText = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n");

  const canOpenPlaner =
    ready || isDraftReadyForPlaner(draft, "", conversationText);

  const summaryLine = draftSummaryLine(draft, locale);

  const openPlanerWithDraft = () => {
    if (creating) return;
    const localTrips = getAllTrips();
    if (!user && localTrips.length >= 1) {
      setLoginHint(true);
      return;
    }

    setCreating(true);
    try {
      const trip = applyDraftToTrip(createNewTrip(), draft, conversationText);
      saveTrip(trip);
      setActiveTripId(trip.id);
      closeAssistant();
      const related = draft.relatedReport || inferRelatedReport(conversationText);
      const hasRoute = draft.routeStops && draft.routeStops.length >= 2;
      const tab = hasRoute
        ? "route"
        : related || trip.modules?.includes("hotels")
          ? "hotels"
          : trip.modules?.[0] || "hotels";
      router.push(`/planer?tab=${tab}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => openAssistant()}
          className="fixed bottom-5 right-5 z-[60] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#0071e3] text-white shadow-[0_8px_28px_rgba(0,113,227,0.35)] transition hover:bg-[#0077ed] sm:bottom-6 sm:right-6"
          aria-label={t("openAria")}
          title={t("openTitle")}
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-4 right-4 z-[60] flex max-h-[min(100dvh-2rem,42rem)] w-[min(100vw-1.5rem,24rem)] flex-col overflow-hidden rounded-[12px] border border-[#d2d2d7] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.18)] sm:bottom-6 sm:right-6">
          <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-[#e8e8ed] bg-[#f5f5f7] px-4 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-[#1d1d1f]">
                <Sparkles className="h-4 w-4 text-[#0071e3]" />
                {t("title")}
              </p>
              <p className="truncate text-[11px] text-[#86868b]">
                {summaryLine || t("subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={closeAssistant}
              className="rounded-full p-1.5 text-[#86868b] transition hover:bg-white hover:text-[#1d1d1f]"
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            ref={listRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3 [-webkit-overflow-scrolling:touch]"
          >
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[92%] rounded-[12px] px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#0071e3] text-white"
                      : "bg-[#f5f5f7] text-[#1d1d1f]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">
                    {m.content === WELCOME ? t("welcome") : m.content}
                  </p>
                  {m.tips && m.tips.length > 0 && (
                    <ul className="mt-2 space-y-1 border-t border-black/5 pt-2 text-xs text-[#6e6e73]">
                      {m.tips.map((tip) => (
                        <li key={tip}>· {tip}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#86868b]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("thinking")}
              </div>
            )}
          </div>

          {(canOpenPlaner || loginHint || error) && (
            <div className="flex-shrink-0 space-y-2 border-t border-[#e8e8ed] px-4 py-3">
              {error && <p className="text-xs text-red-600">{error}</p>}
              {loginHint ? (
                <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-950">
                  <p className="mb-2 font-medium">{t("guestLimit")}</p>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/login" className="st-btn-primary px-3 py-1.5 text-xs" onClick={closeAssistant}>
                      {t("signIn")}
                    </Link>
                    <button
                      type="button"
                      className="text-xs font-medium text-amber-900 underline"
                      onClick={() => {
                        const trips = getAllTrips();
                        if (trips[0]) {
                          setActiveTripId(trips[0].id);
                          closeAssistant();
                          router.push("/planer");
                        }
                      }}
                    >
                      {t("openExisting")}
                    </button>
                  </div>
                </div>
              ) : canOpenPlaner ? (
                <div className="space-y-2">
                  {summaryLine ? (
                    <p className="text-xs font-medium text-[#1d1d1f] leading-snug">
                      {summaryLine}
                    </p>
                  ) : null}
                  <p className="text-[11px] text-[#86868b] leading-snug">
                    {t("readyHint")}
                  </p>
                  <button
                    type="button"
                    onClick={openPlanerWithDraft}
                    disabled={creating}
                    className="st-btn-primary w-full py-2.5 text-sm disabled:opacity-50"
                  >
                    {creating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {t("openPlanner")}
                  </button>
                </div>
              ) : null}
            </div>
          )}

          <form onSubmit={onSubmit} className="flex gap-2 border-t border-[#e8e8ed] p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder")}
              disabled={loading}
              className="min-w-0 flex-1 rounded-[12px] border border-[#d2d2d7] bg-[#f5f5f7] px-3 py-2 text-sm text-[#1d1d1f] outline-none focus:border-[#0071e3]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-[12px] bg-[#1d1d1f] px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {t("send")}
            </button>
          </form>

          <div className="flex items-center justify-between gap-2 border-t border-[#e8e8ed] bg-[#fafafa] px-3 py-2 text-[10px] text-[#86868b]">
            <button type="button" onClick={resetChat} className="hover:text-[#1d1d1f]">
              {t("restart")}
            </button>
            {!ready && messages.length <= 2 ? (
              <button
                type="button"
                onClick={loadCoteDemo}
                className="hover:text-[#1d1d1f]"
              >
                {t("demoCote")}
              </button>
            ) : (
              <Link href="/reise-planen" onClick={closeAssistant} className="hover:text-[#1d1d1f]">
                {t("manual")}
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
