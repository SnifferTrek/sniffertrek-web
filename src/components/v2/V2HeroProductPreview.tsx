"use client";

import { useEffect, useState } from "react";
import { BedDouble, MapPin } from "lucide-react";
import { V2_DEMO_TRIP } from "@/lib/v2HomeData";
import V2RouteMap from "./V2RouteMap";

export default function V2HeroProductPreview() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className={`v2-hero-preview ${ready ? "is-ready" : ""}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={V2_DEMO_TRIP.selected.photo}
        alt=""
        className="v2-hero-preview-bg"
        width={1400}
        height={900}
      />
      <div className="v2-hero-preview-overlay" />

      <div className="v2-hero-preview-meta">
        <p className="v2-hero-preview-title">{V2_DEMO_TRIP.title}</p>
        <div className="v2-hero-preview-stats">
          <span>{V2_DEMO_TRIP.duration}</span>
          <span>{V2_DEMO_TRIP.distance}</span>
          <span>Roadtrip</span>
        </div>
      </div>

      <div className="v2-hero-preview-map-wrap">
        <V2RouteMap
          highlight={V2_DEMO_TRIP.selectedStop}
          animate={ready}
          numbered
          showLabels
          compact
          className="v2-hero-preview-map"
        />
      </div>

      <div className="v2-hero-preview-float">
        <p className="v2-hero-preview-float-title">{V2_DEMO_TRIP.selected.name}</p>
        <p className="v2-hero-preview-float-sub">{V2_DEMO_TRIP.selected.nightsLabel}</p>
        <div className="v2-hero-preview-float-row">
          <BedDouble className="h-3.5 w-3.5" aria-hidden />
          <span>{V2_DEMO_TRIP.hotel}</span>
        </div>
        <div className="v2-hero-preview-float-row">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          <span>{V2_DEMO_TRIP.savedPlaces} gespeicherte Orte</span>
        </div>
      </div>

      <p className="sr-only">
        Beispielreiseplan {V2_DEMO_TRIP.title}: {V2_DEMO_TRIP.corridor}
      </p>
    </div>
  );
}
