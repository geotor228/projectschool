"use client";

import { useRef } from "react";
import { useRevealChildren } from "@/lib/gsap";

const timeline = [
  { date: "13 сент. 2026", label: "Черновик TDR", status: "в работе" },
  { date: "Ближайшие недели", label: "Проведение эксперимента (EXP-01)", status: "план готов" },
  { date: "Середина окт. 2026", label: "Финальная версия TDR", status: "впереди" },
  { date: "TBD", label: "Защита перед комиссией", status: "дата не назначена" },
];

export default function Closing() {
  const ref = useRef<HTMLElement>(null);
  useRevealChildren(ref, ".reveal");

  return (
    <section
      ref={ref}
      className="px-6 py-32 text-center"
      style={{ backgroundColor: "var(--color-foreground)", color: "var(--color-background)" }}
    >
      <div className="mx-auto max-w-2xl">
        <p className="reveal font-mono text-sm tracking-widest uppercase opacity-70">
          Где мы сейчас
        </p>
        <h2 className="reveal mt-4 text-3xl font-semibold sm:text-4xl">
          Работа продолжается
        </h2>

        <div className="mt-12 space-y-6 text-left">
          {timeline.map((t) => (
            <div key={t.label} className="reveal flex items-start gap-4 border-b border-white/10 pb-4">
              <span className="w-32 shrink-0 font-mono text-xs opacity-70">{t.date}</span>
              <div>
                <p className="font-medium">{t.label}</p>
                <p className="text-xs opacity-60">{t.status}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="reveal mt-12 text-sm opacity-70">
          Georgijs Topolevs · Immaculada Concepció, Lloret de Mar · 2026
        </p>
      </div>
    </section>
  );
}
