"use client";

import { useEffect, useState, type ReactNode } from "react";

export default function JourneyGate({
  journey,
  fallback,
}: {
  journey: ReactNode;
  fallback: ReactNode;
}) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  return reducedMotion ? fallback : journey;
}
