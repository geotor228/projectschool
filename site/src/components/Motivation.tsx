"use client";

import { useRef } from "react";
import { useRevealChildren } from "@/lib/gsap";

export default function Motivation() {
  const ref = useRef<HTMLElement>(null);
  useRevealChildren(ref, ".reveal");

  return (
    <section ref={ref} className="mx-auto max-w-3xl px-6 py-32">
      <p className="reveal font-mono text-sm tracking-widest uppercase" style={{ color: "var(--color-primary)" }}>
        Часть I · Мотивация
      </p>

      <h2 className="reveal mt-4 text-3xl font-semibold sm:text-4xl">
        Почему запах — это химия, а не магия
      </h2>

      <div
        className="reveal mt-8 rounded-2xl border-2 border-dashed p-6 text-sm"
        style={{ borderColor: "var(--color-accent)", color: "var(--color-muted-foreground)" }}
      >
        ✏️ <strong>Место для твоей личной истории.</strong> Здесь нужен твой настоящий голос —
        что лично тебя привело к теме ароматов и дистилляции: конкретный момент, интерес,
        человек, книга, эксперимент в детстве. Я не выдумываю это за тебя — пришли мне текст
        (даже черновой, в 3-5 предложений), и я оформлю его в этом блоке.
      </div>

      <p className="reveal mt-8 leading-relaxed">
        Изначальная идея работы сравнивала аромат разных растений — апельсина, розы,
        розмарина — просто по тому, какое из эфирных масел получится извлечь «лучше».
        Но у такого сравнения нет строгой научной логики: разные растения содержат
        принципиально разные молекулы, и «лучше» тут ничего не доказывает.
      </p>

      <p className="reveal mt-6 leading-relaxed">
        Поэтому дизайн исследования был пересмотрен: вместо сравнения растений — сравнение{" "}
        <strong>методов</strong> экстракции одного и того же сырья. Это превращает работу
        из описательной в экспериментальную: у неё появляется независимая переменная
        (метод), зависимая переменная (выход масла, %) и проверяемая гипотеза.
      </p>

      <p className="reveal mt-6 leading-relaxed">
        Вопрос, который стоит в центре работы:{" "}
        <em>
          ускоряет ли акустическая кавитация — ультразвуковая обработка — извлечение
          эфирного масла по сравнению с классической гидродистилляцией, и если да, то
          насколько?
        </em>
      </p>
    </section>
  );
}
