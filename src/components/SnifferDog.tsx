"use client";

export default function SnifferDog() {
  return (
    <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-2xl shadow-lg">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-auto block"
        poster="/images/travel-scene-bg.png"
      >
        <source src="/images/sniffer-trek-hero.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
