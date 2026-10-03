"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export default function V2Reveal({
  children,
  className = "",
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
        { threshold: 0.08, rootMargin: "0px 0px 15% 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`v2-reveal${visible ? " is-in" : ""} ${className}`.trim()}
      style={{ "--v2-delay": `${delayMs}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
