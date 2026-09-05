"use client";

import { useRef } from "react";
import { useRevealChildren } from "@/lib/gsap";

const conditions = [
  {
    label: "Условие A · Контроль",
    title: "Классическая гидродистилляция",
    points: [
      "Аппарат Клевенджера: колба, градуированная ловушка, обратный холодильник",
      "Нагрев до кипения, температура удерживается постоянной",
      "Объём масла считывается каждые ~15 минут до стабилизации",
    ],
  },
  {
    label: "Условие B · Эксперимент",
    title: "UAHD — ультразвуковая интенсификация",
    points: [
      "Предварительная обработка сырья в ультразвуковой ванне (35–60 Вт, ~40 кГц)",
      "Акустическая кавитация разрушает масляные железы лепестков",
      "Затем — та же дистилляция в аппарате Клевенджера",
    ],
  },
];

const materials = [
  "Аппарат Клевенджера (полный стеклянный комплект)",
  "Источник нагрева с контролем температуры",
  "Ультразвуковая ванна, 35–60 Вт",
  "Точные весы (0.01 г)",
  "Термометр",
  "Свежие лепестки [PROVISIONAL: Rosa damascena]",
  "Термостойкие перчатки, защитные очки",
];

export default function Methodology() {
  const ref = useRef<HTMLElement>(null);
  useRevealChildren(ref, ".reveal");

  return (
    <section
      ref={ref}
      className="px-6 py-32"
      style={{ backgroundColor: "var(--color-card)" }}
    >
      <div className="mx-auto max-w-5xl">
        <p className="reveal font-mono text-sm tracking-widest uppercase" style={{ color: "var(--color-primary)" }}>
          Часть II · Методология
        </p>
        <h2 className="reveal mt-4 text-3xl font-semibold sm:text-4xl">
          Два метода, одна переменная
        </h2>
        <p className="reveal mt-6 max-w-2xl leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
          Гипотеза: UAHD даст более высокий выход эфирного масла за меньшее время,
          благодаря кавитации, разрушающей клеточные структуры лепестков и облегчающей
          высвобождение летучих соединений.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {conditions.map((c) => (
            <div
              key={c.title}
              className="reveal rounded-2xl border p-6"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}
            >
              <p className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--color-accent)" }}>
                {c.label}
              </p>
              <h3 className="mt-2 text-xl font-semibold">{c.title}</h3>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
                {c.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span aria-hidden="true">—</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="reveal mt-10 rounded-2xl p-6" style={{ backgroundColor: "var(--color-muted)" }}>
          <p className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--color-primary)" }}>
            Rendiment (%) = m(масла) / m(лепестков) × 100
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Минимум 3 независимых повторения на условие — для расчёта среднего и
            стандартного отклонения.
          </p>
        </div>

        <div className="mt-12 grid gap-10 sm:grid-cols-2">
          <div className="reveal">
            <h3 className="text-lg font-semibold">Оборудование и материалы</h3>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
              {materials.map((m) => (
                <li key={m} className="flex gap-2">
                  <span aria-hidden="true">·</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="reveal">
            <h3 className="text-lg font-semibold">Известные ограничения</h3>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
              Доступная мощность ультразвука (бытовая ванна) значительно ниже, чем в
              лабораторных исследованиях-ориентирах (~750 Вт зонд-гомогенизатор) — эффект
              может быть заметно слабее описанного в литературе. Состав масла (не только
              выход) не анализируется — нет доступа к ГХ-МС.
            </p>
          </div>
        </div>

        <p
          className="reveal mt-12 rounded-xl border-l-4 p-4 text-sm"
          style={{ borderColor: "var(--color-accent)", color: "var(--color-foreground)" }}
        >
          ⚠️ Эксперимент ещё не проведён — результаты появятся на этой странице после
          защиты. Ниже — только план и обоснование.
        </p>
      </div>
    </section>
  );
}
