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

/** Opacity for a chapter spanning [start,end], fading in/out over a fixed absolute slice of
 * progress (not a fraction of the chapter's own width). Chapters in CHAPTERS are contiguous
 * (one ends exactly where the next begins), so fading each one strictly inside its own [start,end]
 * meant both the outgoing and incoming chapter hit zero opacity at the exact same instant — a
 * blank-text beat at every chapter change. Fading `edge` past both ends instead makes adjacent
 * chapters genuinely overlap (each sits at ~50% right at the shared boundary), a real crossfade
 * instead of a cut to nothing. The very first chapter (start === 0) is fully visible from the
 * top of the page instead of fading in from nothing — there is nothing before it to fade in from. */
export function chapterOpacity(
  progress: number,
  [start, end]: readonly [number, number],
  edge = 0.035,
): number {
  const fadeIn = start <= 0 ? 1 : Math.min(1, Math.max(0, (progress - (start - edge)) / (2 * edge)));
  const fadeOut = Math.min(1, Math.max(0, (end + edge - progress) / (2 * edge)));
  return Math.min(fadeIn, fadeOut);
}
