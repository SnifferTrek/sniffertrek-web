"use client";

import { useState, useId } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowRight, CalendarDays, Check, Compass, FileText, MapPin, Route, BedDouble, Sparkles, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import s from "./V2PlanningOverview.module.css";

type ModuleId = "route" | "stay" | "places";
type TripExample = {
  label: string; destination: string; duration: string; people: string;
  route: string[]; stay: string[]; places: string[]; note: string;
  details: Record<ModuleId, string>;
};

export default function V2HowItWorks() {
  const t = useTranslations("planningOverview");
  const exampleId = useId();
  const modules = [
    { id: "route" as const, title: t("routeTitle"), short: t("routeShort"), icon: Route, description: t("routeDescription"), color: "blue" },
    { id: "stay" as const, title: t("stayTitle"), short: t("stayShort"), icon: BedDouble, description: t("stayDescription"), color: "amber" },
    { id: "places" as const, title: t("placesTitle"), short: t("placesShort"), icon: Compass, description: t("placesDescription"), color: "green" },
  ];
  const trips = t.raw("trips") as TripExample[];
  const [tripIndex, setTripIndex] = useState(0);
  const [active, setActive] = useState<ModuleId>("route");
  const [included, setIncluded] = useState<Record<ModuleId, boolean>>({ route: true, stay: true, places: true });
  const trip = trips[tripIndex];
  const selected = modules.find((m) => m.id === active)!;
  const count = modules.filter((m) => included[m.id]).length;
  return (
    <section className={s.page} id="so-funktionierts" aria-labelledby={`${exampleId}-title`}>
      <header className={s.hero}>
        <p className={s.eyebrow}>{t("eyebrow")}</p>
        <h2 id={`${exampleId}-title`}>{t("titleStart")}<br /><span>{t("titleEnd")}</span></h2>
        <p className={s.intro}>{t("introStart")}<br className={s.desktopBreak} /> {t("introEnd")}</p>
        <div className={s.switcher} aria-label={t("chooseExample")}>
          {trips.map((t, i) => <button key={t.label} type="button" aria-pressed={i === tripIndex} onClick={() => setTripIndex(i)}>{t.label}</button>)}
        </div>
      </header>
      <section className={s.diagram} aria-label={t("diagramLabel")}>
        <div className={s.stepLabel}><span>01</span> {t("step1")}</div>
        <div className={s.destination}>
          <div className={s.pin}><MapPin size={26} /></div>
          <div><span className={s.overline}>{t("destinationLabel")}</span><h3>{trip.destination}</h3></div>
          <div className={s.tripMeta}><span><CalendarDays size={15} />{trip.duration}</span><span><Users size={15} />{trip.people}</span></div>
        </div>
        <div className={s.connector} aria-hidden="true"><ArrowDown size={19} /></div>
        <div className={s.stepLabel}><span>02</span> {t("step2")}</div>
        <p className={s.hint}>{t("hint")}</p>
        <div className={s.branch} aria-hidden="true" />
        <div className={s.cards}>
          {modules.map((m) => <button type="button" key={m.id} className={`${s.card} ${s[m.color]} ${active === m.id ? s.active : ""}`} aria-pressed={active === m.id} aria-controls={exampleId} onClick={() => setActive(m.id)}>
            <div className={s.cardTop}><span className={s.icon}><m.icon size={23} /></span><span className={s.status}>{included[m.id] ? <><Check size={12} /> {t("included")}</> : t("optional")}</span></div>
            <h3>{m.title}</h3><p>{m.description}</p><span className={s.cardLink}>{t("viewExample")} <ArrowRight size={15} /></span>
          </button>)}
        </div>
        <div id={exampleId} className={s.detail} aria-live="polite">
          <div><p className={s.overline}>{t("exampleLabel")}</p><h3>{selected.title}</h3><p className={s.description}>{trip.details[active]}</p>
            <div className={s.chips}>{trip[active].map((item, index) => <span key={`${active}-${index}`}>{item}</span>)}</div>
          </div>
          <label className={s.toggle}><input type="checkbox" checked={included[active]} onChange={(e) => setIncluded((prev) => ({ ...prev, [active]: e.target.checked }))} /><span>{t("includeToggle")}</span></label>
        </div>
        <p className={s.optional}><Check size={15} /> {t("optionalHint")}</p>
        <div className={s.connector} aria-hidden="true"><ArrowDown size={19} /></div>
        <div className={s.stepLabel}><span>03</span> {t("step3")}</div>
        <div className={s.result} aria-live="polite">
          <div className={s.resultIntro}><span className={s.resultIcon}><FileText size={27} /></span><p className={s.overline}>{t("planLabel")}</p><h3>{trip.destination}.<br />{t("allInOne")}</h3><p>{trip.note}</p><div className={s.pills}><span>{t("adjust")}</span><span>{t("save")}</span><span>{t("pdf")}</span></div></div>
          <div className={s.paper}><div className={s.paperHeader}><span>{t("paperLabel")}</span><Sparkles size={17} /></div><h3>{trip.destination}</h3><p className={s.paperMeta}>{trip.duration} · {trip.people} · {t("moduleCount", { count })}</p>
            {modules.filter((m) => included[m.id]).map((m) => <div className={s.paperRow} key={m.id}><m.icon size={17} /><div><strong>{m.short}</strong><p>{trip[m.id].join(" · ")}</p></div></div>)}
            {count === 0 && <p className={s.empty}>{t("empty")}</p>}
          </div>
        </div>
      </section>
      <section className={s.cta}><h2>{t("ctaTitle")}</h2><p>{t("ctaText")}</p><Link href="/reise-planen" className={s.primary}>{t("ctaButton")} <ArrowRight size={18} /></Link><small>{t("demoNotice")}</small></section>
    </section>
  );
}
