"use client";

import { useEffect, useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

/**
 * Atlas-Cover: lädt das Foto als Blob (Safari zeigt Unsplash in der Vorschau sonst oft schwarz).
 * data-print-src behält eine stabile URL für den iframe-Druck.
 */
export default function AtlasCoverImage({ src, alt, className }: Props) {
  const proxySrc = `/api/image-proxy?url=${encodeURIComponent(src)}`;
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function load() {
      try {
        const res = await fetch(proxySrc, { cache: "force-cache" });
        if (!res.ok) throw new Error(`proxy ${res.status}`);
        const blob = await res.blob();
        if (cancelled) return;
        if (!blob.type.startsWith("image/")) throw new Error("not image");
        objectUrl = URL.createObjectURL(blob);
        setDisplaySrc(objectUrl);
      } catch {
        if (!cancelled) setDisplaySrc(proxySrc);
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [proxySrc]);

  if (!displaySrc) {
    return (
      <div
        className={className}
        aria-hidden="true"
        data-print-src={proxySrc}
        style={{
          background:
            "linear-gradient(120deg, #d7dee8 0%, #b8c4d4 50%, #d7dee8 100%)",
        }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      loading="eager"
      decoding="async"
      data-print-src={proxySrc}
    />
  );
}
