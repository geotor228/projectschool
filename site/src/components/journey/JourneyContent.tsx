const card =
  "rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-card)]/80 p-6 backdrop-blur-md sm:p-8";

export function HeroContent() {
  return (
    <div className="pointer-events-none text-white">
      <p className="font-mono text-xs tracking-[0.3em] text-white/60 uppercase">
        Treball de Recerca · Batxillerat
      </p>
      <h1 className="mt-6 text-3xl leading-tight font-semibold sm:text-5xl">
        Química de les aromes и её извлечение методом дистилляции
      </h1>
      <p className="mt-6 max-w-xl text-sm text-white/70 sm:text-base">
        Сравнение классической гидродистилляции и ультразвуковой интенсификации (UAHD) на примере
        извлечения эфирного масла из лепестков цветка.
      </p>
      <p className="mt-6 font-mono text-xs text-white/60">
        Georgijs Topolevs · Immaculada Concepció, Lloret de Mar · тьютор Raquel Arévalo
      </p>
      <p className="mt-10 font-mono text-xs tracking-widest text-white/50 uppercase">
        Скролль — путешествие начинается
      </p>
    </div>
  );
}

export function ClosingContent() {
  return (
    <div className={`${card} max-w-xl text-center text-white`}>
      <p className="font-mono text-xs tracking-widest text-white/60 uppercase">Где мы сейчас</p>
      <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Работа продолжается</h2>
      <div className="mt-6 space-y-3 text-left text-sm text-white/70">
        <p>
          <span className="font-mono text-xs text-white/50">13 сент. 2026</span> — черновик TDR
        </p>
        <p>
          <span className="font-mono text-xs text-white/50">Сейчас</span> — заказан аппарат
          Клевенджера, куплен источник нагрева, весы и ультразвук уже есть
        </p>
        <p>
          <span className="font-mono text-xs text-white/50">Ближайшие недели</span> — проведение
          эксперимента EXP-01 (мин. 3 повторения на условие)
        </p>
        <p>
          <span className="font-mono text-xs text-white/50">Середина окт. 2026</span> — финальная
          версия TDR с реальными данными
        </p>
        <p>
          <span className="font-mono text-xs text-white/50">Защита</span> — дата уточняется
        </p>
      </div>
      <p className="mt-8 font-mono text-xs text-white/40">
        Georgijs Topolevs · Immaculada Concepció, Lloret de Mar · 2026
      </p>
    </div>
  );
}
