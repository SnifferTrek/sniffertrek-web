"use client";

import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { ensureFullObjectUrl, ensureThumbUrl, getCachedThumbUrl, isMediaRef } from "@/lib/tripPhotoStore";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | undefined;
  /** full = höhere Auflösung (Lightbox); Listen immer thumb */
  variant?: "thumb" | "full";
};

/**
 * Zeigt `st:`-Refs als Thumbnail (Object-URL), Data-/HTTP-URLs unverändert.
 * Volle Bilder werden nicht in den Trip-State geladen.
 */
export default function MediaImg({ src, variant = "thumb", alt = "", className, ...rest }: Props) {
  const initial =
    src && !isMediaRef(src) ? src : src ? getCachedThumbUrl(src) || "" : "";
  const [url, setUrl] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    if (!src) {
      setUrl("");
      return;
    }
    if (!isMediaRef(src)) {
      setUrl(src);
      return;
    }
    if (variant === "thumb") {
      const cached = getCachedThumbUrl(src);
      if (cached) {
        setUrl(cached);
        return;
      }
    }
    const load = variant === "full" ? ensureFullObjectUrl(src) : ensureThumbUrl(src);
    void load.then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [src, variant]);

  if (!url) {
    return <div className={`bg-gray-100 ${className || ""}`} aria-hidden />;
  }

  return <img src={url} alt={alt} className={className} loading="lazy" decoding="async" {...rest} />;
}
