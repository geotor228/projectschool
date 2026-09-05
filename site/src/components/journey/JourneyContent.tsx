import SourceTag from "./SourceTag";

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

export function MotivationContent() {
  return (
    <div className={`${card} max-w-2xl text-white`}>
      <p className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--color-secondary)" }}>
        Часть I · Класс, где всё началось
      </p>
      <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Почему запах — это химия</h2>

      <div className="mt-6 rounded-xl border-2 border-dashed border-amber-400/50 p-4 text-sm text-white/70">
        ✏️ Место для твоей личной истории — пришли 3-5 предложений о том, что лично тебя привело к
        этой теме, и я вставлю их сюда вместо этого плейсхолдера.
      </div>

      <p className="mt-6 text-sm leading-relaxed text-white/80 sm:text-base">
        Первая версия работы сравнивала аромат разных растений — апельсина, розы, розмарина —
        просто по тому, какое эфирное масло получится извлечь «лучше». Но у такого сравнения нет
        строгой научной логики: разные растения содержат принципиально разные молекулы, и «лучше»
        здесь ничего не доказывает — это не эксперимент, а коллекция наблюдений.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-white/80 sm:text-base">
        Поэтому дизайн исследования был полностью пересмотрен: вместо сравнения растений — сравнение{" "}
        <strong>методов</strong> экстракции одного и того же сырья. Это превращает работу из
        описательной в экспериментальную: появляется независимая переменная (метод), зависимая
        переменная (выход масла, %) и проверяемая гипотеза, которую можно подтвердить или
        опровергнуть числами.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-white/80 sm:text-base">
        Рассматривался и третий вариант интенсификации — микроволновая экстракция (MAHD), — но он
        был отклонён из соображений безопасности: он потребовал бы небезопасной модификации бытовой
        микроволновки. Ультразвуковая ванна оказалась единственным методом интенсификации, доступным
        безопасно и в домашних условиях.
      </p>
      <p className="mt-6 text-sm leading-relaxed text-white/80 sm:text-base">
        Вопрос, который стоит в центре работы:{" "}
        <em>
          ускоряет ли акустическая кавитация — ультразвуковая обработка — извлечение эфирного
          масла по сравнению с классической гидродистилляцией, и если да, то насколько?
        </em>
      </p>
    </div>
  );
}

export function MethodologyContent() {
  return (
    <div className={`${card} max-w-2xl text-white`}>
      <p className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--color-secondary)" }}>
        Часть II · Внутри лаборатории
      </p>
      <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Два метода, одна переменная</h2>

      <p className="mt-4 text-sm leading-relaxed text-white/80">
        Гипотеза: акустическая кавитация — рост и схлопывание микропузырьков — разрушает клеточные
        структуры (масляные железы) лепестков и облегчает высвобождение летучих соединений,
        ускоряя и увеличивая выход эфирного масла.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-white/5 p-4">
          <p className="font-mono text-xs uppercase" style={{ color: "var(--color-accent)" }}>
            Условие A · Контроль
          </p>
          <p className="mt-2 text-sm text-white/80">
            Классическая гидродистилляция в аппарате Клевенджера: нагрев до кипения, замер объёма
            масла в градуированной ловушке каждые 15 минут до стабилизации.
          </p>
        </div>
        <div className="rounded-lg bg-white/5 p-4">
          <p className="font-mono text-xs uppercase" style={{ color: "var(--color-accent)" }}>
            Условие B · UAHD
          </p>
          <p className="mt-2 text-sm text-white/80">
            Предобработка ультразвуком (35–60 Вт, ~40 кГц, время подбирается экспериментально),
            затем та же дистилляция в том же аппарате.
          </p>
        </div>
      </div>

      <p className="mt-6 font-mono text-xs text-white/60">
        Rendiment (%) = m(масла) / m(лепестков) × 100
      </p>
      <p className="mt-2 text-sm leading-relaxed text-white/80">
        Минимум 3 независимых повторения на каждое условие — этого достаточно, чтобы посчитать
        среднее значение и стандартное отклонение (s = √[Σ(xᵢ−x̄)²/(n−1)]), и построить график с
        погрешностями. При наличии времени — тест Стьюдента для проверки статистической значимости
        разницы между методами.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-white/50">Безопасность</p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Термостойкие перчатки и защитные очки на всём протяжении опыта. Аппарат Клевенджера —
            стеклянный и хрупкий, избегать термоударов. Ультразвуковую ванну не открывать во время
            работы. Хорошая вентиляция помещения.
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-white/50">Известные ограничения</p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Доступная мощность ультразвука значительно ниже лабораторных зонд-гомогенизаторов
            (~750 Вт в источниках-ориентирах) — эффект может быть заметно слабее описанного в
            литературе. Состав масла не анализируется — нет доступа к ГХ-МС, сравнивается только
            количественный выход.
          </p>
        </div>
      </div>

      <p className="mt-6 rounded-lg border-l-4 border-amber-500 bg-white/5 p-3 text-xs text-white/70">
        ⚠️ Эксперимент ещё не проведён — результаты появятся на этой странице после защиты. Раздел
        методологии показывает план и обоснование, а не данные.
      </p>
    </div>
  );
}

export function AcademicContent() {
  return (
    <div className={`${card} max-w-2xl text-white`}>
      <p className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--color-secondary)" }}>
        Часть III · На молекулярном уровне
      </p>
      <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">На чём это основано</h2>

      <div className="mt-6 space-y-5 text-sm leading-relaxed text-white/80">
        <div>
          <p>
            <strong className="text-white">Как мы чувствуем запах.</strong> Обонятельные рецепторы
            кодируются целым семейством генов — около 388-390 функциональных генов у человека из
            почти тысячи в семействе (остальные — псевдогены). Молекула запаха связывается с
            рецептором, запуская сигнал, который мозг распознаёт как конкретный аромат.
          </p>
          <p className="mt-1">
            <SourceTag
              citation="Buck, L.M.; Axel, R. (1991)"
              detail="Cell 65(1):175–187. Открытие семейства генов обонятельных рецепторов — Нобелевская премия по физиологии и медицине 2004 года."
            >
              Buck & Axel, 1991
            </SourceTag>{" "}
            ·{" "}
            <SourceTag
              citation="Malnic, B.; Godfrey, P.A.; Buck, L.B. (2004)"
              detail="PNAS 101(8):2584–2589. Точное число функциональных генов обонятельных рецепторов у человека."
            >
              Malnic et al., 2004
            </SourceTag>
          </p>
        </div>

        <div>
          <p>
            <strong className="text-white">Откуда берётся аромат в растении.</strong> Терпены —
            строительные блоки большинства ароматических молекул — растение синтезирует по двум
            параллельным путям (мевалонатному, MVA, и метилэритритолфосфатному, MEP), которые
            работают совместно именно в тканях цветка, а не только в цитрусовых, как считалось
            раньше.
          </p>
          <p className="mt-1">
            <SourceTag
              citation="Dudareva, N. et al. (2005)"
              detail="PNAS 102(3):933–938. MVA/MEP пути биосинтеза терпенов работают совместно в цветочной ткани львиного зева."
            >
              Dudareva et al., 2005
            </SourceTag>
          </p>
        </div>

        <div>
          <p>
            <strong className="text-white">Почему кавитация ускоряет экстракцию.</strong>{" "}
            Ультразвук создаёт микропузырьки, которые растут у поверхности клетки и схлопываются
            при высокой амплитуде — разрывая клеточную стенку и облегчая выход эфирного масла
            наружу через ускоренный массообмен, причём в более мягких условиях, чем при обычном
            нагреве.
          </p>
          <p className="mt-1">
            <SourceTag
              citation="Thilakarathna, R.C.N. et al. (2022)"
              detail="J Food Sci Technol 60(4):1222–1236. Обзорная статья: механизм акустической кавитации (20–40 кГц) при экстракции масел."
            >
              Thilakarathna et al., 2022
            </SourceTag>
          </p>
        </div>
      </div>

      <div
        className="mt-6 rounded-2xl border p-5"
        style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(0,0,0,0.2)" }}
      >
        <p className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--color-accent)" }}>
          Ключевой источник — ориентир методологии
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/80">
          <SourceTag
            citation="Cadena-Cadena et al. (2025)"
            detail="BioTech (Basel) 14(3):59. Ультразвук (750 Вт, 40% амплитуда, 20 мин) перед гидродистилляцией: выход 1.5±0.49% против 0.7±0.03% без него на кожуре грейпфрута."
          >
            Cadena-Cadena et al., 2025
          </SourceTag>{" "}
          — ультразвуковая предобработка перед гидродистилляцией дала рост выхода на 114% на
          кожуре грейпфрута. Протокол чёткий и воспроизводимый — главный ориентир для дизайна
          этого эксперимента.
        </p>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-white/60">
        Честная оговорка: часть цифр из смежных источников (например, заявленный рост «в 2514 раз»
        у Abdel Samad et al., 2023) в самом TDR помечена как непроверенная напрямую по
        первоисточнику — здесь и в тексте работы приводятся только данные, которые подтверждены и
        воспроизводимы.
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
