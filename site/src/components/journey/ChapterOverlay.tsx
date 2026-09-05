"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { subscribeJourney, chapterOpacity, journeyState } from "@/lib/journeyState";

export default function ChapterOverlay({
  range,
  children,
  align = "center",
}: {
  range: readonly [number, number];
  children: ReactNode;
  align?: "center" | "left";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apply = (p: number) => {
      const el = ref.current;
      if (!el) return;
      const opacity = chapterOpacity(p, range);
      el.style.opacity = String(opacity);
      el.style.transform = `translateY(${(1 - opacity) * 16}px)`;
      el.style.pointerEvents = opacity > 0.15 ? "auto" : "none";
    };
    apply(journeyState.progress); // reflect current state immediately, don't wait for the first scroll event
    return subscribeJourney(apply);
  }, [range]);

  return (
    <div
      ref={ref}
      className={`pointer-events-none fixed inset-0 flex items-center px-6 opacity-0 transition-opacity duration-100 ${
        align === "center" ? "justify-center text-center" : "justify-start text-left"
      }`}
    >
      <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto">{children}</div>
    </div>
  );
}
