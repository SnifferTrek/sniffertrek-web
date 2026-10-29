"use client";

import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, CalendarDays, Check, Compass, FileText, MapPin, Route, BedDouble, Sparkles, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import s from "./planning.module.css";

type ModuleId = "route" | "stay" | "places";
const modules = [
  { id: "route" as const, title: "Anreise & Route", short: "Route", icon: Route, description: "Wie du hinkommst. Und was auf dem Weg liegt.", color: "blue" },
  { id: "stay" as const, title: "Unterkünfte", short: "Unterkünfte", icon: BedDouble, description: "Die richtigen Orte, um eine Weile zu bleiben.", color: "amber" },
  { id: "places" as const, title: "Orte & Erlebnisse", short: "Orte", icon: Compass, description: "Das, wofür du später wiederkommen möchtest.", color: "green" },
];
const trips = [
  { label: "Roadtrip", destination: "Côte d’Azur", duration: "5 Nächte", people: "2 Reisende", route: ["Zürich", "Nizza", "Cannes", "Saint-Tropez"], stay: ["Nizza · 2 Nächte", "Cannes · 1 Nacht", "Saint-Tropez · 2 Nächte"], places: ["Cours Saleya", "Küstenweg am Cap d’Antibes", "Altstadt von Saint-Tropez"], note: "Vom ersten Kaffee in Nizza bis zum letzten Abend am Meer.", details: { route: "Start und Ziel festlegen, Zwischenstopps ergänzen und die Etappen deiner Reise ordnen.", stay: "Übernachtungen den passenden Stopps zuordnen. Angebote ansehen und beim Anbieter buchen.", places: "Lieblingsorte entdecken und zur Reise hinzufügen. Du entscheidest, was in deinen Plan kommt." } },
  { label: "Städtetrip", destination: "Venedig", duration: "3 Nächte", people: "2 Reisende", route: ["Zürich", "Venedig", "Zürich"], stay: ["Venedig · 3 Nächte"], places: ["Cannaregio", "Rialtobrücke", "Ein Nachmittag auf Burano"], note: "Eine Stadt, kleine Entdeckungen und genug Zeit dazwischen.", details: { route: "An- und Rückreise zusammenstellen. Auch eine Reise ohne viele Zwischenstopps bekommt einen klaren Plan.", stay: "Eine Unterkunft als Ausgangspunkt wählen und alle Nächte an einem Ort zusammenhalten.", places: "Sehenswürdigkeiten und kleine Entdeckungen sammeln, die du während deines Aufenthalts besuchen möchtest." } },
];

export default function PlanningDemo() {
  const [tripIndex, setTripIndex] = useState(0);
  const [active, setActive] = useState<ModuleId>("route");
  const [included, setIncluded] = useState<Record<ModuleId, boolean>>({ route: true, stay: true, places: true });
  const trip = trips[tripIndex];
  const selected = modules.find((m) => m.id === active)!;
  const count = modules.filter((m) => included[m.id]).length;
  return (
    <div className={`${s.page} v2-home`}>
      <nav className={s.nav} aria-label="Testseite">
        <Link href="/" className={s.brand}>Sniffer<span>Trek</span><span className={s.preview}>Vorschau</span></Link>
        <Link href="/" className={s.back}><ArrowLeft size={15} /> Zur Startseite</Link>
      </nav>
      <header className={s.hero}>
        <p className={s.eyebrow}>DEINE IDEE. DEINE BAUSTEINE. DEINE REISE.</p>
        <h1>So wird aus einem Ziel<br /><span>dein Reiseplan.</span></h1>
        <p className={s.intro}>Alles hängt zusammen. Du wählst, was zu deiner Reise gehört.<br className={s.desktopBreak} /> SnifferTrek bringt es in einen gemeinsamen Plan.</p>
        <div className={s.switcher} aria-label="Beispielreise wählen">
          {trips.map((t, i) => <button key={t.label} type="button" aria-pressed={i === tripIndex} onClick={() => setTripIndex(i)}>{t.label}</button>)}
        </div>
      </header>
      <section className={s.diagram} aria-label="Von der Reiseidee zum Reiseplan">
        <div className={s.stepLabel}><span>01</span> Deine Reise beginnt mit einer Idee</div>
        <div className={s.destination}>
          <div className={s.pin}><MapPin size={26} /></div>
          <div><span className={s.overline}>DEIN REISEZIEL</span><h2>{trip.destination}</h2></div>
          <div className={s.tripMeta}><span><CalendarDays size={15} />{trip.duration}</span><span><Users size={15} />{trip.people}</span></div>
        </div>
        <div className={s.connector} aria-hidden="true"><ArrowDown size={19} /></div>
        <div className={s.stepLabel}><span>02</span> Wähle deine Bausteine</div>
        <p className={s.hint}>Klicke auf einen Baustein, um ein Beispiel zu sehen.</p>
        <div className={s.branch} aria-hidden="true" />
        <div className={s.cards}>
          {modules.map((m) => <button type="button" key={m.id} className={`${s.card} ${s[m.color]} ${active === m.id ? s.active : ""}`} aria-pressed={active === m.id} aria-controls="module-example" onClick={() => setActive(m.id)}>
            <div className={s.cardTop}><span className={s.icon}><m.icon size={23} /></span><span className={s.status}>{included[m.id] ? <><Check size={12} /> Im Plan</> : "Optional"}</span></div>
            <h3>{m.title}</h3><p>{m.description}</p><span className={s.cardLink}>Beispiel ansehen <ArrowRight size={15} /></span>
          </button>)}
        </div>
        <div id="module-example" className={s.detail} aria-live="polite">
          <div><p className={s.overline}>SO KÖNNTE DEINE REISE AUSSEHEN</p><h3>{selected.title}</h3><p className={s.description}>{trip.details[active]}</p>
            <div className={s.chips}>{trip[active].map((item) => <span key={item}>{item}</span>)}</div>
          </div>
          <label className={s.toggle}><input type="checkbox" checked={included[active]} onChange={(e) => setIncluded((prev) => ({ ...prev, [active]: e.target.checked }))} /><span>In meinem Beispielplan</span></label>
        </div>
        <p className={s.optional}><Check size={15} /> Nur was du brauchst. Alle Bausteine sind optional.</p>
        <div className={s.connector} aria-hidden="true"><ArrowDown size={19} /></div>
        <div className={s.stepLabel}><span>03</span> Alles wird eine Reise</div>
        <div className={s.result} aria-live="polite">
          <div className={s.resultIntro}><span className={s.resultIcon}><FileText size={27} /></span><p className={s.overline}>DEIN PERSÖNLICHER REISEPLAN</p><h2>{trip.destination}.<br />Alles an einem Ort.</h2><p>{trip.note}</p><div className={s.pills}><span>Anpassen</span><span>Speichern</span><span>Als PDF mitnehmen</span></div></div>
          <div className={s.paper}><div className={s.paperHeader}><span>SNIFFERTREK · BEISPIELREISE</span><Sparkles size={17} /></div><h3>{trip.destination}</h3><p className={s.paperMeta}>{trip.duration} · {trip.people} · {count} {count === 1 ? "Baustein" : "Bausteine"}</p>
            {modules.filter((m) => included[m.id]).map((m) => <div className={s.paperRow} key={m.id}><m.icon size={17} /><div><strong>{m.short}</strong><p>{trip[m.id].join(" · ")}</p></div></div>)}
            {count === 0 && <p className={s.empty}>Noch ganz offen. Wähle oben einen Baustein und dein Beispielplan füllt sich.</p>}
          </div>
        </div>
      </section>
      <section className={s.cta}><h2>Und wohin zieht es dich?</h2><p>Deine Reise darf genauso individuell sein wie du.</p><Link href="/reise-planen" className={s.primary}>Eigene Reise planen <ArrowRight size={18} /></Link><small>Die Beispiele oben sind eine Vorschau. Es wird keine Reise gespeichert.</small></section>
      <footer className={s.footer}><span>SnifferTrek · Planungsübersicht zum Ausprobieren</span><Link href="/">Zur Startseite <ArrowRight size={14} /></Link></footer>
    </div>
  );
}
