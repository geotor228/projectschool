const card =
  "rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-card)]/70 p-6 backdrop-blur-md sm:p-8";

export function HeroContent() {
  return (
    <div className="pointer-events-none text-white">
      <p className="font-mono text-xs tracking-[0.3em] text-white/60 uppercase">
        Treball de Recerca · Batxillerat
      </p>
      <h1 className="mt-6 text-3xl leading-tight font-semibold sm:text-5xl">
        Química de les aromes и её извлечение методом дистилляции
      </h1>
      <p className="mt-6 font-mono text-xs text-white/60">
        Georgijs Topolevs · Immaculada Concepció, Lloret de Mar
      </p>
      <p className="mt-10 font-mono text-xs tracking-widest text-white/50 uppercase">
        Скролль — путешествие начинается
      </p>
    </div>
  );
}

export function MotivationContent() {
  return (
    <div className={`${card} text-white`}>
      <p className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--color-secondary)" }}>
        Часть I · Класс, где всё началось
      </p>
      <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Почему запах — это химия</h2>

      <div className="mt-6 rounded-xl border-2 border-dashed border-amber-400/50 p-4 text-sm text-white/70">
        ✏️ Место для твоей личной истории — пришли 3-5 предложений о том, что лично тебя
        привело к этой теме, и я вставлю их сюда.
      </div>

      <p className="mt-6 text-sm leading-relaxed text-white/80 sm:text-base">
        Первая версия работы сравнивала аромат разных растений — апельсина, розы,
        розмарина. Но у такого сравнения нет строгой научной логики: разные растения
        содержат разные молекулы, и «лучше» здесь ничего не доказывает.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-white/80 sm:text-base">
        Поэтому дизайн исследования был пересмотрен: сравниваются не растения, а{" "}
        <strong>методы</strong> экстракции одного и того же сырья — классическая
        гидродистилляция против ультразвуковой (UAHD).
      </p>
    </div>
  );
}

export function MethodologyContent() {
  return (
    <div className={`${card} text-white`}>
      <p className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--color-secondary)" }}>
        Часть II · Внутри лаборатории
      </p>
      <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Два метода, одна переменная</h2>

      <p className="mt-4 text-sm leading-relaxed text-white/80">
        Гипотеза: акустическая кавитация разрушает клеточные структуры лепестков и
        ускоряет выход эфирного масла.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-white/5 p-4">
          <p className="font-mono text-xs uppercase" style={{ color: "var(--color-accent)" }}>
            Контроль
          </p>
          <p className="mt-2 text-sm text-white/80">
            Классическая гидродистилляция в аппарате Клевенджера — нагрев до кипения,
            замер объёма масла каждые 15 минут.
          </p>
        </div>
        <div className="rounded-lg bg-white/5 p-4">
          <p className="font-mono text-xs uppercase" style={{ color: "var(--color-accent)" }}>
            UAHD
          </p>
          <p className="mt-2 text-sm text-white/80">
            Предобработка ультразвуком (35–60 Вт, ~40 кГц), затем та же дистилляция.
          </p>
        </div>
      </div>

      <p className="mt-6 font-mono text-xs text-white/60">
        Rendiment (%) = m(масла) / m(лепестков) × 100 · мин. 3 повторения на условие
      </p>

      <p className="mt-6 rounded-lg border-l-4 border-amber-500 bg-white/5 p-3 text-xs text-white/70">
        ⚠️ Эксперимент ещё не проведён — результаты появятся после защиты.
      </p>
    </div>
  );
}

export function AcademicContent() {
  return (
    <div className={`${card} text-white`}>
      <p className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--color-secondary)" }}>
        Часть III · На молекулярном уровне
      </p>
      <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">На чём это основано</h2>

      <ul className="mt-6 space-y-4 text-sm text-white/80">
        <li>
          <strong className="text-white">Обоняние:</strong> ~388–390 генов обонятельных
          рецепторов распознают молекулы запаха.{" "}
          <span className="font-mono text-xs text-white/50">Buck & Axel, 1991 · Malnic et al., 2004</span>
        </li>
        <li>
          <strong className="text-white">Терпены:</strong> синтезируются в цветке по
          двум путям — MVA и MEP.{" "}
          <span className="font-mono text-xs text-white/50">Dudareva et al., 2005</span>
        </li>
        <li>
          <strong className="text-white">Кавитация:</strong> ультразвуковые пузырьки
          схлопываются у стенки клетки, ускоряя выход масла.{" "}
          <span className="font-mono text-xs text-white/50">Thilakarathna et al., 2022</span>
        </li>
      </ul>

      <div className="mt-6 rounded-lg bg-white/5 p-4">
        <p className="font-mono text-xs uppercase" style={{ color: "var(--color-accent)" }}>
          Ключевой ориентир
        </p>
        <p className="mt-2 text-sm text-white/80">
          Cadena-Cadena et al., 2025: ультразвук перед дистилляцией дал +114% выхода
          масла (грейпфрут).
        </p>
      </div>
    </div>
  );
}

export function ClosingContent() {
  return (
    <div className={`${card} text-center text-white`}>
      <p className="font-mono text-xs tracking-widest text-white/60 uppercase">Где мы сейчас</p>
      <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Работа продолжается</h2>
      <div className="mt-6 space-y-2 text-sm text-white/70">
        <p>13 сент. 2026 — черновик TDR</p>
        <p>Ближайшие недели — эксперимент EXP-01</p>
        <p>Середина окт. 2026 — финальная версия</p>
        <p>Защита — дата уточняется</p>
      </div>
    </div>
  );
}
