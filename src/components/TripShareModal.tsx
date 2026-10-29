"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Link2, Loader2, Mail, Share2, Trash2, X } from "lucide-react";
import {
  buildTripShareUrl,
  createTripShare,
  inviteTripByEmail,
  listTripEmailInvites,
  listTripShares,
  revokeTripEmailInvite,
  revokeTripShare,
  type ShareLinkRole,
  type TripEmailInviteRow,
  type TripShareRow,
} from "@/lib/tripShare";

interface TripShareModalProps {
  tripId: string;
  tripName: string;
  userId: string;
  open: boolean;
  onClose: () => void;
  onEnsureCloudSaved?: () => Promise<{ ok: boolean; error?: string }>;
}

export default function TripShareModal({
  tripId,
  tripName,
  userId,
  open,
  onClose,
  onEnsureCloudSaved,
}: TripShareModalProps) {
  const t = useTranslations("tripShare");
  const [role, setRole] = useState<ShareLinkRole>("editor");
  const [email, setEmail] = useState("");
  const [shares, setShares] = useState<TripShareRow[]>([]);
  const [invites, setInvites] = useState<TripEmailInviteRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showLinkFallback, setShowLinkFallback] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [shareRows, inviteRows] = await Promise.all([
        listTripShares(tripId),
        listTripEmailInvites(tripId),
      ]);
      setShares(shareRows);
      setInvites(inviteRows);
    } catch {
      setError(t("loadFail"));
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setSuccess("");
    setError("");
    void refresh();
  }, [open, refresh]);

  if (!open) return null;

  const ensureCloud = async () => {
    if (!onEnsureCloudSaved) return { ok: true as const };
    return onEnsureCloudSaved();
  };

  const handleInviteEmail = async () => {
    setInviting(true);
    setError("");
    setSuccess("");
    const cloud = await ensureCloud();
    if (!cloud.ok) {
      setInviting(false);
      setError(
        cloud.error ||
          t("cloudThenInvite")
      );
      return;
    }
    const result = await inviteTripByEmail(tripId, email, role);
    setInviting(false);
    if (!result.ok) {
      setError(result.error || t("inviteFail"));
      return;
    }
    setEmail("");
    setSuccess(
      result.status === "added"
        ? t("unlocked")
        : t("invitedMsg")
    );
    void refresh();
  };

  const handleCreate = async () => {
    setCreating(true);
    setError("");
    setSuccess("");
    const cloud = await ensureCloud();
    if (!cloud.ok) {
      setCreating(false);
      setError(
        cloud.error ||
          t("cloudThenShare")
      );
      return;
    }
    const result = await createTripShare(tripId, userId, role);
    setCreating(false);
    if (!result.ok || !result.share) {
      setError(result.error || t("linkFail"));
      return;
    }
    setShares((prev) => [result.share!, ...prev]);
    const url = buildTripShareUrl(result.share.token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(result.share.id);
      setSuccess(t("linkCopied"));
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setSuccess(t("linkCreated", { url }));
    }
  };

  const handleCopy = async (share: TripShareRow) => {
    const url = buildTripShareUrl(share.token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(share.id);
      setSuccess(t("copied"));
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError(t("copyManual", { url }));
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    const ok = await revokeTripShare(shareId);
    if (!ok) {
      setError(t("revokeFail"));
      return;
    }
    setShares((prev) => prev.filter((s) => s.id !== shareId));
  };

  const handleRevokeInvite = async (inviteId: string) => {
    const ok = await revokeTripEmailInvite(inviteId);
    if (!ok) {
      setError(t("removeInviteFail"));
      return;
    }
    setInvites((prev) => prev.filter((i) => i.id !== inviteId));
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trip-share-title"
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{t("eyebrow")}</p>
            <h2 id="trip-share-title" className="mt-0.5 text-lg font-semibold text-zinc-900">
              {t("title", { name: tripName || t("tripFallback") })}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label={t("close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <p className="text-sm text-zinc-600">
            {t("intro")}
          </p>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("rights")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("editor")}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                  role === "editor"
                    ? "border-[var(--st-primary)] bg-blue-50 text-[var(--st-primary)]"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <span className="font-semibold">{t("write")}</span>
                <span className="mt-0.5 block text-[11px] opacity-80">{t("writeHint")}</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("viewer")}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                  role === "viewer"
                    ? "border-[var(--st-primary)] bg-blue-50 text-[var(--st-primary)]"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <span className="font-semibold">{t("read")}</span>
                <span className="mt-0.5 block text-[11px] opacity-80">{t("readHint")}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">{t("email")}</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleInviteEmail();
                  }
                }}
                placeholder={t("emailPh")}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--st-primary)]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleInviteEmail()}
            disabled={inviting || !email.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--st-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--st-primary-hover)] disabled:opacity-50"
          >
            {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {t("invite")}
          </button>

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {success}
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("invited")}
            </p>
            {loading ? (
              <div className="flex items-center gap-2 py-3 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("loading")}
              </div>
            ) : invites.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 px-3 py-4 text-center text-sm text-zinc-400">
                {t("noInvites")}
              </p>
            ) : (
              <ul className="space-y-2">
                {invites.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-zinc-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-zinc-800">{invite.email}</p>
                      <p className="text-[11px] text-zinc-400">
                        {invite.role === "editor" ? t("write") : t("read")}
                        {invite.accepted_at ? ` · ${t("active")}` : ` · ${t("waiting")}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleRevokeInvite(invite.id)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                      title={t("removeInvite")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-zinc-100 pt-3">
            <button
              type="button"
              onClick={() => setShowLinkFallback((v) => !v)}
              className="text-xs font-medium text-zinc-500 hover:text-[var(--st-primary)]"
            >
              {showLinkFallback ? t("hideLink") : t("useLink")}
            </button>

            {showLinkFallback && (
              <div className="mt-3 space-y-3">
                <button
                  type="button"
                  onClick={() => void handleCreate()}
                  disabled={creating}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  {t("createLink")}
                </button>

                {shares.length > 0 && (
                  <ul className="space-y-2">
                    {shares.map((share) => (
                      <li
                        key={share.id}
                        className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2"
                      >
                        <Link2 className="h-4 w-4 shrink-0 text-zinc-400" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-zinc-800">
                            {share.role === "editor" ? t("write") : t("read")}
                          </p>
                          <input
                            readOnly
                            value={buildTripShareUrl(share.token)}
                            onFocus={(e) => e.currentTarget.select()}
                            className="mt-0.5 w-full truncate rounded border-0 bg-transparent p-0 text-[11px] text-zinc-400 focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleCopy(share)}
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-white hover:text-[var(--st-primary)]"
                          title={t("copyLink")}
                        >
                          {copiedId === share.id ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRevokeShare(share.id)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                          title={t("revokeLink")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
