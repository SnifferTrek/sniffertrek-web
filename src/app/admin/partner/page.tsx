"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  ExternalLink,
  Check,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Save,
  RotateCcw,
  Plane,
  Hotel,
  Car,
  Train,
  MapPin,
  Smartphone,
  Shield,
  Sparkles,
  Copy,
  Search,
  ShieldAlert,
} from "lucide-react";
import {
  AffiliatePartner,
  PartnerStatus,
  loadPartners,
  savePartners,
  defaultPartners,
  getModules,
  getPartnersByModule,
} from "@/lib/affiliateConfig";
import { useAuth } from "@/components/AuthProvider";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

const moduleIcons: Record<string, React.ElementType> = {
  "Flüge": Plane,
  Hotels: Hotel,
  Mietwagen: Car,
  "Züge": Train,
  "POIs & Aktivitäten": MapPin,
  eSIM: Smartphone,
  Reiseversicherung: Shield,
  "AI / Tools": Sparkles,
};

const statusConfig: Record<
  PartnerStatus,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  active: {
    label: "Aktiv",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    icon: Check,
  },
  open: {
    label: "Anmeldung offen",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    icon: Clock,
  },
  todo: {
    label: "Konzept",
    color: "text-gray-500",
    bg: "bg-gray-50 border-gray-200",
    icon: AlertCircle,
  },
};

export default function PartnerOverviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAdmin = !!user && !!ADMIN_EMAIL && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const [partners, setPartners] = useState<AffiliatePartner[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<AffiliatePartner>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [filter, setFilter] = useState<"all" | PartnerStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) return;
    const loaded = loadPartners();
    setPartners(loaded);
    setExpandedModules(new Set(getModules()));
  }, [loading, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Zugang verweigert
          </h1>
          <p className="text-gray-500 mb-8">
            Dieser Bereich ist nur für den Administrator zugänglich.
          </p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all"
          >
            Zur Startseite
          </button>
        </div>
      </div>
    );
  }

  const toggleModule = (module: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  };

  const startEdit = (partner: AffiliatePartner) => {
    setEditingId(partner.id);
    setEditValues({
      affiliateId: partner.affiliateId,
      baseUrl: partner.baseUrl,
      status: partner.status,
      statusNote: partner.statusNote,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updated = partners.map((p) =>
      p.id === editingId ? { ...p, ...editValues } : p
    );
    setPartners(updated);
    savePartners(updated);
    setEditingId(null);
    setEditValues({});
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const resetToDefaults = () => {
    if (
      confirm(
        "Alle Änderungen zurücksetzen? Die Standard-Konfiguration wird wiederhergestellt."
      )
    ) {
      setPartners([...defaultPartners]);
      savePartners(defaultPartners);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const modules = getModules();

  const filteredPartners = partners.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (
      searchTerm &&
      !p.provider.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !p.module.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  const stats = {
    total: partners.length,
    active: partners.filter((p) => p.status === "active").length,
    open: partners.filter((p) => p.status === "open").length,
    todo: partners.filter((p) => p.status === "todo").length,
    withId: partners.filter((p) => p.affiliateId.trim() !== "").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-6 h-6 text-gray-400" />
            <h1 className="text-2xl font-bold text-white">
              Partner & Affiliate-Übersicht
            </h1>
          </div>
          <p className="text-gray-400 text-sm">
            Verwalte alle Affiliate-Partner, API-Keys und Registrierungslinks.
            Klicke auf einen Partner um die Affiliate-ID einzutragen.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <div className="text-xs text-gray-400 mt-1">Partner gesamt</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-green-100 shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
            <div className="text-xs text-gray-400 mt-1">Aktiv</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm text-center">
            <div className="text-2xl font-bold text-amber-600">
              {stats.open}
            </div>
            <div className="text-xs text-gray-400 mt-1">Anmeldung offen</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <div className="text-2xl font-bold text-gray-400">
              {stats.todo}
            </div>
            <div className="text-xs text-gray-400 mt-1">Konzept</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.withId}
            </div>
            <div className="text-xs text-gray-400 mt-1">Mit Affiliate-ID</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Partner suchen..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {(
              [
                { key: "all", label: "Alle" },
                { key: "active", label: "Aktiv" },
                { key: "open", label: "Offen" },
                { key: "todo", label: "Konzept" },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === f.key
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={resetToDefaults}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>

        {/* Save confirmation */}
        {saveStatus === "saved" && (
          <div className="mb-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
            <Check className="w-4 h-4" />
            Änderungen gespeichert
          </div>
        )}

        {/* Partner List by Module */}
        <div className="space-y-4">
          {modules.map((module) => {
            const modulePartners = getPartnersByModule(
              module,
              filteredPartners
            );
            if (modulePartners.length === 0) return null;

            const Icon = moduleIcons[module] || Settings;
            const isExpanded = expandedModules.has(module);
            const activeCount = modulePartners.filter(
              (p) => p.status === "active"
            ).length;

            return (
              <div
                key={module}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(module)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">{module}</h3>
                      <p className="text-xs text-gray-400">
                        {modulePartners.length} Partner &middot; {activeCount}{" "}
                        aktiv
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Partner Rows */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {modulePartners.map((partner) => {
                      const status = statusConfig[partner.status];
                      const StatusIcon = status.icon;
                      const isEditing = editingId === partner.id;

                      return (
                        <div
                          key={partner.id}
                          className={`border-b border-gray-50 last:border-b-0 ${
                            isEditing ? "bg-blue-50/50" : "hover:bg-gray-50"
                          } transition-colors`}
                        >
                          {/* Partner Row */}
                          <div
                            className="px-6 py-4 cursor-pointer"
                            onClick={() =>
                              isEditing ? undefined : startEdit(partner)
                            }
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="font-medium text-gray-900">
                                    {partner.provider}
                                  </h4>
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.color}`}
                                  >
                                    <StatusIcon className="w-3 h-3" />
                                    {status.label}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400">
                                  <span>API: {partner.api}</span>
                                  <span>Provision: {partner.commission}</span>
                                  {partner.statusNote && (
                                    <span className="text-amber-600">
                                      {partner.statusNote}
                                    </span>
                                  )}
                                </div>
                                {partner.affiliateId && !isEditing && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-600 font-mono">
                                      ID: {partner.affiliateId}
                                    </code>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(partner.affiliateId);
                                      }}
                                      className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                      title="Kopieren"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                <a
                                  href={partner.registrationLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                  Registrierung
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Edit Form */}
                          {isEditing && (
                            <div className="px-6 pb-4 space-y-3">
                              <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                                    Affiliate-ID / Partner-Key
                                  </label>
                                  <input
                                    type="text"
                                    value={editValues.affiliateId ?? ""}
                                    onChange={(e) =>
                                      setEditValues((v) => ({
                                        ...v,
                                        affiliateId: e.target.value,
                                      }))
                                    }
                                    placeholder="z.B. 10ZQa9h"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                                    Base URL
                                  </label>
                                  <input
                                    type="text"
                                    value={editValues.baseUrl ?? ""}
                                    onChange={(e) =>
                                      setEditValues((v) => ({
                                        ...v,
                                        baseUrl: e.target.value,
                                      }))
                                    }
                                    placeholder="https://..."
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                              <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                                    Status
                                  </label>
                                  <select
                                    value={editValues.status ?? partner.status}
                                    onChange={(e) =>
                                      setEditValues((v) => ({
                                        ...v,
                                        status: e.target
                                          .value as PartnerStatus,
                                      }))
                                    }
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <option value="active">Aktiv</option>
                                    <option value="open">
                                      Anmeldung offen
                                    </option>
                                    <option value="todo">Konzept</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                                    Notiz
                                  </label>
                                  <input
                                    type="text"
                                    value={editValues.statusNote ?? ""}
                                    onChange={(e) =>
                                      setEditValues((v) => ({
                                        ...v,
                                        statusNote: e.target.value,
                                      }))
                                    }
                                    placeholder="Optionale Notiz..."
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cancelEdit();
                                  }}
                                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                  Abbrechen
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveEdit();
                                  }}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                  <Save className="w-4 h-4" />
                                  Speichern
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Legende</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {Object.entries(statusConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.color}`}
                  >
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {key === "active"
                      ? "API/Affiliate funktioniert"
                      : key === "open"
                      ? "Registrierung nötig"
                      : "Noch in Planung"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Klicke auf einen Partner, um die Affiliate-ID oder den API-Key
            einzutragen. Die Daten werden lokal im Browser gespeichert.
          </p>
        </div>
      </div>
    </div>
  );
}
