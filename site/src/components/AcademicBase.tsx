"use client";

import { useRef } from "react";
import { useRevealChildren } from "@/lib/gsap";

const theory = [
  {
    title: "Как мы чувствуем запах",
    body:
      "Обонятельные рецепторы кодируются целым семейством генов — около 388-390 функциональных генов у человека. Молекула запаха связывается с рецептором, запуская сигнал, который мозг распознаёт как конкретный аромат.",
    source: "Buck & Axel, 1991 · Malnic et al., 2004",
  },
  {
    title: "Откуда берётся аромат в растении",
    body:
      "Терпены — строительные блоки большинства ароматических молекул — растение синтезирует по двум параллельным путям (MVA и MEP), которые работают совместно именно в тканях цветка.",
    source: "Dudareva et al., 2005",
  },
  {
    title: "Почему кавитация ускоряет экстракцию",
    body:
      "Ультразвук создаёт микропузырьки, которые растут у поверхности клетки и схлопываются — разрывая клеточную стенку и облегчая выход эфирного масла наружу.",
    source: "Thilakarathna et al., 2022",
  },
];

const keySource = {
  title:
    "Effect of Ultrasonic Pretreatment on the Extraction Process of Essential Oils from Grapefruit By-Products",
  authors: "Cadena-Cadena et al., 2025 · BioTech (Basel) 14(3):59",
  finding:
    "Ультразвуковая предобработка (750 Вт, 20 мин) перед гидродистилляцией дала выход 1.5±0.49% против 0.7±0.03% без неё — рост на 114%. Главный ориентир для дизайна этого эксперимента.",
};

export default function AcademicBase() {
  const ref = useRef<HTMLElement>(null);
  useRevealChildren(ref, ".reveal");

  return (
    <section ref={ref} className="mx-auto max-w-5xl px-6 py-32">
      <p className="reveal font-mono text-sm tracking-widest uppercase" style={{ color: "var(--color-primary)" }}>
        Часть III · Академическая база
      </p>
      <h2 className="reveal mt-4 text-3xl font-semibold sm:text-4xl">
        На чём это основано
      </h2>

      <div className="mt-12 grid gap-8 sm:grid-cols-3">
        {theory.map((t) => (
          <div key={t.title} className="reveal">
            <h3 className="text-lg font-semibold">{t.title}</h3>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
              {t.body}
            </p>
            <p className="mt-3 font-mono text-xs" style={{ color: "var(--color-primary)" }}>
              {t.source}
            </p>
          </div>
        ))}
      </div>

      <div
        className="reveal mt-16 rounded-2xl border p-8"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <p className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--color-accent)" }}>
          Ключевой источник
        </p>
        <h3 className="mt-2 text-lg font-semibold">{keySource.title}</h3>
        <p className="mt-1 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          {keySource.authors}
        </p>
        <p className="mt-4 text-sm leading-relaxed">{keySource.finding}</p>
      </div>

      <p
        className="reveal mt-8 text-sm leading-relaxed"
        style={{ color: "var(--color-muted-foreground)" }}
      >
        Честная оговорка: часть цифр из смежных источников (напр. Abdel Samad et al., 2023)
        помечена в самом TDR как непроверенная напрямую по первоисточнику — здесь
        приводятся только те данные, что подтверждены и воспроизводимы.
      </p>
    </section>
  );
}
