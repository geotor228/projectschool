"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { subscribeJourney, journeyState, cardOpacity } from "@/lib/journeyState";

type Side = "left" | "right" | "bottom";

const SLIDE_DISTANCE = 56;

const POSITION_CLASS: Record<Side, string> = {
  left: "left-4 top-1/2 -translate-y-1/2 items-start text-left sm:left-10",
  right: "right-4 top-1/2 -translate-y-1/2 items-end text-right sm:right-10",
  bottom: "bottom-8 left-1/2 -translate-x-1/2 items-center text-center sm:bottom-12",
};

/**
 * One of the three museum-plaque cards a "room" scene shows in place of the old single long
 * chapter block: a short eyebrow + title + one-line teaser, an optional bold headline fact (the
 * plaque's hook), and — for the cards that carry it — the full original academic detail (formulas,
 * exact figures, cited sources) behind a "Подробнее" expand, so nothing from the TDR itself is lost,
 * it just isn't what a first-time visitor reads by default.
 *
 * `range` is this card's own slice of progress, computed by splitIntoThirds so the three cards in
 * one scene never overlap in time — each fades fully out before the next fades in, which is the
 * actual fix for the original bug (two chapters both padding a fade past their shared boundary, so
 * their text sat on top of each other for a moment on every transition).
 */
export default function SceneCard({
  range,
  side,
  eyebrow,
  title,
  hook,
  children,
  detail,
}: {
  range: readonly [number, number];
  side: Side;
  eyebrow: string;
  title: string;
  hook?: string;
  children: ReactNode;
  detail?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const apply = (p: number) => {
      const el = ref.current;
      if (!el) return;
      const opacity = cardOpacity(p, range);
      const offset = (1 - opacity) * SLIDE_DISTANCE;
      el.style.opacity = String(opacity);
      el.style.transform =
        side === "left" ? `translateX(${-offset}px)` : side === "right" ? `translateX(${offset}px)` : `translateY(${offset}px)`;
      el.style.pointerEvents = opacity > 0.6 ? "auto" : "none";
      const isActive = p > range[0] && p < range[1];
      setActive((prev) => (prev !== isActive ? isActive : prev));
    };
    apply(journeyState.progress);
    return subscribeJourney(apply);
  }, [range, side]);

  // Collapsed automatically once the card leaves the screen, so scrolling back to it later starts
  // fresh instead of silently remembering it was left open.
  useEffect(() => {
    if (!active) setExpanded(false);
  }, [active]);

  return (
    <div
      ref={ref}
      data-scene-card={title}
      className={`pointer-events-none fixed z-20 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 opacity-0 ${POSITION_CLASS[side]}`}
    >
      <div
        className="rounded-2xl border p-5 backdrop-blur-md sm:p-6"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <p className="font-mono text-[11px] tracking-[0.25em] uppercase" style={{ color: "var(--color-secondary)" }}>
          {eyebrow}
        </p>
        <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">{title}</h3>
        {hook && (
          <p className="mt-3 font-mono text-2xl leading-none font-semibold sm:text-3xl" style={{ color: "var(--color-accent)" }}>
            {hook}
          </p>
        )}
        <div className="mt-3 text-sm leading-relaxed text-white/80">{children}</div>
        {detail && (
          <>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="pointer-events-auto mt-4 cursor-pointer font-mono text-xs tracking-widest text-white/50 uppercase underline underline-offset-4 hover:text-white/80"
            >
              {expanded ? "Свернуть" : "Подробнее"}
            </button>
            {expanded && (
              <div className="pointer-events-auto mt-3 max-h-[42vh] overflow-y-auto border-t border-white/10 pt-3 text-xs leading-relaxed text-white/70">
                {detail}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
