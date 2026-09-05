"use client";

import { useEffect, useRef, useState } from "react";
import { CHAPTERS, subscribeJourney } from "@/lib/journeyState";

const ITEMS: { key: keyof typeof CHAPTERS; label: string }[] = [
  { key: "hero", label: "Начало" },
  { key: "motivation", label: "Мотивация" },
  { key: "methodology", label: "Методология" },
  { key: "academic", label: "Академическая база" },
  { key: "closing", label: "Статус" },
];

export default function JourneyNav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("hero");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return subscribeJourney((p) => {
      const current = ITEMS.slice()
        .reverse()
        .find((item) => p >= CHAPTERS[item.key][0]);
      if (current) setActive(current.key);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const goTo = (key: keyof typeof CHAPTERS) => {
    const [start, end] = CHAPTERS[key];
    // Land just past the fade-in edge (see chapterOpacity's `edge` fraction) so the
    // chapter is already fully visible on arrival, not still fading in.
    const targetProgress = start + (end - start) * 0.22;
    const doc = document.documentElement;
    const target = targetProgress * (doc.scrollHeight - window.innerHeight);
    window.scrollTo({ top: target, behavior: "smooth" });
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="fixed top-6 right-6 z-50">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Закрыть меню" : "Открыть меню разделов"}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border backdrop-blur-md transition-colors"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-card)",
          color: "var(--color-foreground)",
        }}
      >
        <span className="sr-only">Меню разделов</span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          {open ? (
            <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          ) : (
            <>
              <line x1="2" y1="4.5" x2="16" y2="4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="2" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="2" y1="13.5" x2="16" y2="13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}
        </svg>
      </button>

      <nav
        className="mt-3 min-w-56 origin-top-right rounded-2xl border p-2 backdrop-blur-md transition-all duration-200"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-card)",
          opacity: open ? 1 : 0,
          transform: open ? "scale(1) translateY(0)" : "scale(0.96) translateY(-8px)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <ul className="flex flex-col gap-0.5">
          {ITEMS.map((item) => (
            <li key={item.key}>
              <button
                onClick={() => goTo(item.key)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors"
                style={{
                  color: active === item.key ? "var(--color-accent)" : "var(--color-muted-foreground)",
                  backgroundColor: active === item.key ? "var(--color-muted)" : "transparent",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: active === item.key ? "var(--color-accent)" : "var(--color-border)" }}
                  aria-hidden="true"
                />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
