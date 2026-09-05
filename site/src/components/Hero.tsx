"use client";

import { useRef } from "react";
import { useRevealChildren } from "@/lib/gsap";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  useRevealChildren(ref, ".reveal");

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 20%, var(--color-secondary) 0%, transparent 60%)",
          opacity: 0.15,
        }}
      />

      <p className="reveal font-mono text-sm tracking-[0.3em] text-muted-foreground uppercase" style={{ color: "var(--color-muted-foreground)" }}>
        Treball de Recerca · Batxillerat
      </p>

      <h1 className="reveal mt-6 max-w-4xl text-4xl leading-tight font-semibold sm:text-6xl">
        Química de les aromes и её извлечение методом дистилляции
      </h1>

      <p className="reveal mt-6 max-w-2xl text-lg" style={{ color: "var(--color-muted-foreground)" }}>
        Сравнение классической гидродистилляции и ультразвуковой интенсификации (UAHD)
        на примере извлечения эфирного масла из лепестков розы.
      </p>

      <p className="reveal mt-10 font-mono text-sm" style={{ color: "var(--color-foreground)" }}>
        Georgijs Topolevs · Immaculada Concepció, Lloret de Mar · тьютор Raquel Arévalo
      </p>

      <div className="reveal mt-16 flex flex-col items-center gap-2 opacity-70">
        <span className="font-mono text-xs uppercase tracking-widest">Листай вниз</span>
        <svg width="20" height="28" viewBox="0 0 20 28" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="18" height="26" rx="9" stroke="currentColor" strokeWidth="1.5" />
          <circle className="animate-bounce" cx="10" cy="9" r="2.5" fill="currentColor" />
        </svg>
      </div>
    </section>
  );
}
