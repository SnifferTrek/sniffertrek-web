"use client";
import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { fetchLandmarkThumb } from "@/lib/landmarkService";

export default function WikiThumb({ wikiTitle, alt }: { wikiTitle: string; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!wikiTitle) return;
    fetchLandmarkThumb(wikiTitle).then(setUrl);
  }, [wikiTitle]);

  if (url && loaded) {
    return (
      <img
        src={url}
        alt={alt}
        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
      />
    );
  }

  return (
    <>
      {url && (
        <img
          src={url}
          alt={alt}
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
          onLoad={() => setLoaded(true)}
          onError={() => setUrl(null)}
          style={{ display: "none" }}
        />
      )}
      <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
        {url ? (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        ) : (
          <MapPin className="w-5 h-5 text-gray-300" />
        )}
      </div>
    </>
  );
}
