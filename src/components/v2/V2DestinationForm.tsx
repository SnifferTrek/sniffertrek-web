"use client";

import { ArrowRight } from "lucide-react";
import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { savePlanIntent } from "@/lib/planIntent";
import { V2_PLAN_HREF } from "@/lib/v2HomeData";

type Props = {
  label?: string;
  hideLabel?: boolean;
  placeholder?: string;
  buttonLabel?: string;
  className?: string;
  id?: string;
};

export default function V2DestinationForm({
  label: labelProp,
  hideLabel = false,
  placeholder: placeholderProp,
  buttonLabel: buttonLabelProp,
  className = "",
  id = "v2-destination",
}: Props) {
  const t = useTranslations("v2Home");
  const tFooter = useTranslations("footer");
  const label = labelProp ?? t("formLabel");
  const placeholder = placeholderProp ?? t("formPlaceholder");
  const buttonLabel = buttonLabelProp ?? tFooter("planTrip");
  const router = useRouter();
  const [destination, setDestination] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (destination.trim()) {
      savePlanIntent(destination);
    }
    router.push(V2_PLAN_HREF);
  };

  return (
    <form onSubmit={handleSubmit} className={`v2-destination-form ${className}`}>
      <label htmlFor={id} className={`v2-destination-label${hideLabel ? " sr-only" : ""}`}>
        {label}
      </label>
      <div className="v2-destination-row">
        <input
          id={id}
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder={placeholder}
          className="v2-input v2-destination-input"
          aria-label={label}
        />
        <button type="submit" className="v2-btn v2-destination-btn">
          {buttonLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </form>
  );
}
