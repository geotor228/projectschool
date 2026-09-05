export type JourneyListener = (progress: number) => void;

/** Mutable, non-reactive progress store (0 → 1) — read every frame by R3F via useFrame,
 * and pushed to HTML overlays via subscribe(). Avoids React re-renders on scroll. */
export const journeyState = { progress: 0 };

const listeners = new Set<JourneyListener>();

export function subscribeJourney(fn: JourneyListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setJourneyProgress(p: number) {
  journeyState.progress = p;
  listeners.forEach((fn) => fn(p));
}

/** Chapter ranges along the 0→1 journey. */
export const CHAPTERS = {
  hero: [0, 0.08] as const,
  motivation: [0.08, 0.32] as const,
  methodology: [0.32, 0.64] as const,
  academic: [0.64, 0.88] as const,
  closing: [0.88, 1] as const,
};

/** Local 0→1 progress within [start,end], fading in/out over `edge` fraction of the range.
 * The very first chapter (start === 0) is fully visible from the top of the page instead
 * of fading in from nothing — there is nothing before it to fade in from. */
export function chapterOpacity(
  progress: number,
  [start, end]: readonly [number, number],
  edge = 0.18,
): number {
  const span = end - start;
  const local = (progress - start) / span;
  if (local < 0 || local > 1) return 0;
  const fadeIn = start <= 0 ? 1 : Math.min(1, local / edge);
  const fadeOut = Math.min(1, (1 - local) / edge);
  return Math.min(fadeIn, fadeOut);
}
