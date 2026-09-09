const card =
  "rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-card)]/80 p-6 backdrop-blur-md sm:p-8";

export function HeroContent() {
  return (
    <div className="pointer-events-none text-white">
      <p className="font-mono text-xs tracking-[0.3em] text-white/60 uppercase">
        Treball de Recerca · Batxillerat
      </p>
      <h1 className="mt-6 text-3xl leading-tight font-semibold sm:text-5xl">
        Química de les aromes i la seva extracció: comparació de mètodes de destil·lació
      </h1>
      <p className="mt-6 max-w-xl text-sm text-white/70 sm:text-base">
        Comparació de la hidrodestil·lació convencional i la intensificació per ultrasons (UAHD),
        aplicada a l&apos;extracció d&apos;oli essencial de pètals de rosa.
      </p>
      <p className="mt-6 font-mono text-xs text-white/60">
        Georgijs Topolevs · Immaculada Concepció, Lloret de Mar · tutora Raquel Arévalo
      </p>
      <p className="mt-10 font-mono text-xs tracking-widest text-white/50 uppercase">
        Desplaça&apos;t — comença el viatge
      </p>
    </div>
  );
}

export function ClosingContent() {
  return (
    <div className={`${card} max-w-xl text-center text-white`}>
      <p className="font-mono text-xs tracking-widest text-white/60 uppercase">On som ara</p>
      <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">La feina continua</h2>
      <div className="mt-6 space-y-3 text-left text-sm text-white/70">
        <p>
          <span className="font-mono text-xs text-white/50">13 de setembre de 2026</span> — primer
          esborrany del TDR
        </p>
        <p>
          <span className="font-mono text-xs text-white/50">Ara</span> — aparell de Clevenger
          encarregat, font de calor comprada; la balança i el bany d&apos;ultrasons ja hi són
        </p>
        <p>
          <span className="font-mono text-xs text-white/50">Properes setmanes</span> — realització
          de l&apos;experiment EXP-01 (mín. 3 repeticions per condició)
        </p>
        <p>
          <span className="font-mono text-xs text-white/50">Mitjans d&apos;octubre de 2026</span> —
          versió final del TDR amb dades reals
        </p>
        <p>
          <span className="font-mono text-xs text-white/50">Defensa oral</span> — data pendent de
          confirmar
        </p>
      </div>
      <p className="mt-8 font-mono text-xs text-white/40">
        Georgijs Topolevs · Immaculada Concepció, Lloret de Mar · 2026
      </p>
    </div>
  );
}
