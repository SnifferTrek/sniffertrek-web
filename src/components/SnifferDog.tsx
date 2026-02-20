"use client";

import { useEffect, useState } from "react";

export default function SnifferDog() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-2xl shadow-lg">
      {/* Photorealistic background scene */}
      <img
        src="/images/travel-scene-bg.png"
        alt="Travel landscape"
        className="w-full h-auto block"
        draggable={false}
      />

      {/* Animated dog overlay */}
      <div
        className="absolute bottom-0 left-0 w-full h-full pointer-events-none"
        style={{ perspective: "800px" }}
      >
        <img
          src="/images/sniffer-dog.png"
          alt="Sniffer Dog"
          draggable={false}
          className={`absolute transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
          style={{
            width: "18%",
            bottom: "5%",
            left: "0%",
            animation: loaded ? "snifferWalk 14s ease-in-out infinite, snifferBob 0.6s ease-in-out infinite" : "none",
            transformOrigin: "center bottom",
          }}
        />
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes snifferWalk {
          0%   { left: -5%;  transform: scaleX(1); }
          45%  { left: 62%;  transform: scaleX(1); }
          50%  { left: 62%;  transform: scaleX(-1); }
          95%  { left: -5%;  transform: scaleX(-1); }
          100% { left: -5%;  transform: scaleX(1); }
        }
        @keyframes snifferBob {
          0%, 100% { margin-bottom: 0; }
          50%      { margin-bottom: 2px; }
        }
      `}</style>
    </div>
  );
}
