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

/** The journey's five stations, as world-Z camera positions. Scene.tsx imports this rather than
 * declaring its own copy — camera math here and scene-object placement there have to agree on the
 * same numbers, and they drifted apart once before when each side kept its own constant. */
export const STATIONS = {
  hero: 6,
  classroom: -14,
  lab: -34,
  molecule: -54,
  horizon: -76,
} as const;

type StationKey = keyof typeof STATIONS;
const STATION_ORDER: StationKey[] = ["hero", "classroom", "lab", "molecule", "horizon"];

/** How 0→1 scroll progress is carved up: a wide "dwell" slice per station where the camera parks
 * and the room is actually there to read, and a narrow "transit" slice between each pair of
 * neighbouring stations where the camera actually moves. This replaces a single continuous
 * lerp(hero, horizon, progress) that moved the camera at a constant rate for the entire journey —
 * under that model, walking through a room and flying down the empty gap to the next one cost the
 * same amount of scroll per world-unit, so every room was left just as fast as it was arrived at,
 * and the gap in between (where the camera is often clipping through a room's own back wall on the
 * way to the next station) took just as long to sit through as the room itself.
 *
 * DWELL and TRANSIT are absolute progress widths (not fractions of each other) chosen so 5 dwells
 * + 4 transits sum to exactly 1: DWELL=0.16 leaves 0.2 total for the 4 gaps between stations, i.e.
 * TRANSIT=0.05 each — a quick flick of the wheel next to a dwell's much longer scroll range. */
const DWELL = 0.16;
const TRANSIT = (1 - DWELL * STATION_ORDER.length) / (STATION_ORDER.length - 1);

type DwellSegment = { kind: "dwell"; key: StationKey; start: number; end: number };
type TransitSegment = { kind: "transit"; from: StationKey; to: StationKey; start: number; end: number };
type Segment = DwellSegment | TransitSegment;

function buildSegments(): Segment[] {
  const segments: Segment[] = [];
  let p = 0;
  STATION_ORDER.forEach((key, i) => {
    segments.push({ kind: "dwell", key, start: p, end: p + DWELL });
    p += DWELL;
    if (i < STATION_ORDER.length - 1) {
      const to = STATION_ORDER[i + 1];
      segments.push({ kind: "transit", from: key, to, start: p, end: p + TRANSIT });
      p += TRANSIT;
    }
  });
  return segments;
}

const SEGMENTS = buildSegments();
const TOTAL_TRANSIT = TRANSIT * (STATION_ORDER.length - 1);

/** Convenience lookup: each station's own dwell window, keyed by name — this is what the card
 * system and CHAPTERS below place content within. */
export const DWELL_WINDOW: Record<StationKey, { start: number; end: number }> = Object.fromEntries(
  SEGMENTS.filter((s): s is DwellSegment => s.kind === "dwell").map((s) => [s.key, { start: s.start, end: s.end }]),
) as Record<StationKey, { start: number; end: number }>;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// Smoothstep — eases a transit's start/end instead of snapping into and out of constant velocity.
const smooth = (t: number) => t * t * (3 - 2 * t);

/** The camera's world-Z for a given progress value: flat (parked) through a dwell, eased between
 * two stations' Z through a transit. This is the one place this formula lives — CameraRig, the
 * station-visibility hook and the dissolve hook all call it instead of each keeping its own copy of
 * a lerp, which is what let them silently drift out of sync when the mapping last changed. */
export function cameraZForProgress(p: number): number {
  const cp = clamp01(p);
  for (const seg of SEGMENTS) {
    if (cp <= seg.end + 1e-9) {
      if (seg.kind === "dwell") return STATIONS[seg.key];
      const local = seg.end === seg.start ? 1 : clamp01((cp - seg.start) / (seg.end - seg.start));
      return lerp(STATIONS[seg.from], STATIONS[seg.to], smooth(local));
    }
  }
  return STATIONS[STATION_ORDER[STATION_ORDER.length - 1]];
}

/** 0 while parked in a dwell, rising 0→1 across whichever transit progress currently sits in, and
 * cumulative across the whole journey — i.e. it holds its value through every dwell rather than
 * resetting to 0, so motion driven from it (camera sway/bob) doesn't pop at each dwell boundary.
 * Normalized against the total width of all 4 transits combined, so feeding the same frequency
 * constants the site already used against raw progress reproduces the same-feeling oscillation,
 * just spent only during the brief flights between rooms instead of continuing through every dwell
 * — a full sway cycle over a dwell's much wider scroll range read as seasick rather than lively. */
export function travelPhase(p: number): number {
  const cp = clamp01(p);
  let acc = 0;
  for (const seg of SEGMENTS) {
    if (cp <= seg.end + 1e-9) {
      if (seg.kind === "transit") {
        const local = seg.end === seg.start ? 1 : clamp01((cp - seg.start) / (seg.end - seg.start));
        acc += local * TRANSIT;
      }
      return TOTAL_TRANSIT === 0 ? 0 : acc / TOTAL_TRANSIT;
    }
    if (seg.kind === "transit") acc += TRANSIT;
  }
  return TOTAL_TRANSIT === 0 ? 0 : acc / TOTAL_TRANSIT;
}

/** Opacity for a full-screen curtain that covers the scene during a transit and clears during a
 * dwell, with a short soft edge so it fades rather than snaps. The camera still physically crosses
 * the same stretch of geometry it always did between two stations (a room's own back wall included)
 * — compressing that crossing into a short slice of scroll makes it quick, but doesn't guarantee a
 * slow, deliberate scroll (a dragged scrollbar, a hesitant trackpad) can't still linger inside it
 * and show the clipping. The curtain is what actually guarantees that moment is never seen. */
export function transitCurtainOpacity(p: number, edge = 0.012): number {
  const cp = clamp01(p);
  let maxOpacity = 0;
  for (const seg of SEGMENTS) {
    if (seg.kind !== "transit") continue;
    const fadeIn = clamp01((cp - (seg.start - edge)) / (2 * edge));
    const fadeOut = clamp01((seg.end + edge - cp) / (2 * edge));
    maxOpacity = Math.max(maxOpacity, Math.min(fadeIn, fadeOut));
  }
  return maxOpacity;
}

/** Chapter ranges along the 0→1 journey, now simply each station's own dwell window — the card
 * system only ever needs to be on screen while the camera is actually parked in that station. */
export const CHAPTERS = {
  hero: [DWELL_WINDOW.hero.start, DWELL_WINDOW.hero.end] as const,
  motivation: [DWELL_WINDOW.classroom.start, DWELL_WINDOW.classroom.end] as const,
  methodology: [DWELL_WINDOW.lab.start, DWELL_WINDOW.lab.end] as const,
  academic: [DWELL_WINDOW.molecule.start, DWELL_WINDOW.molecule.end] as const,
  closing: [DWELL_WINDOW.horizon.start, DWELL_WINDOW.horizon.end] as const,
};

/** Opacity for a chapter spanning [start,end], fading in/out over a fixed absolute slice of
 * progress. Chapters now sit inside their own dwell with a whole transit's gap on either side
 * before the next one starts, so — unlike the old contiguous ranges — there's real room for this
 * edge without risking overlap with a neighbour: `edge` stays safely inside the transit width.
 * The very first chapter (start === 0) is fully visible from the top of the page instead of fading
 * in from nothing — there is nothing before it to fade in from. */
export function chapterOpacity(
  progress: number,
  [start, end]: readonly [number, number],
  edge = 0.02,
): number {
  const fadeIn = start <= 0 ? 1 : Math.min(1, Math.max(0, (progress - (start - edge)) / (2 * edge)));
  const fadeOut = Math.min(1, Math.max(0, (end + edge - progress) / (2 * edge)));
  return Math.min(fadeIn, fadeOut);
}

/** Splits one station's dwell window into 3 equal, non-overlapping sub-windows for the 3-card
 * system (intro / detail / bridge) a "room" scene shows in place of one long chapter card. */
export function splitIntoThirds({ start, end }: { start: number; end: number }): [
  readonly [number, number],
  readonly [number, number],
  readonly [number, number],
] {
  const third = (end - start) / 3;
  return [
    [start, start + third] as const,
    [start + third, start + 2 * third] as const,
    [start + 2 * third, end] as const,
  ];
}

/** Opacity for one of the 3 per-scene cards: fades in over the first `edge` of its own range and
 * out over the last `edge`, but — unlike chapterOpacity — never reads outside [start,end] at all,
 * not even by `edge`. Three of these sit back to back with no gap, and the original bug this whole
 * redesign started from was two adjacent chapters both padding a fade past their shared boundary,
 * so both were partway visible at once and their text sat on top of each other; this is the fix for
 * that, applied at the level of every individual card rather than patched once at the top. */
export function cardOpacity(progress: number, [start, end]: readonly [number, number], edge = 0.006): number {
  if (progress <= start || progress >= end) return 0;
  const fadeIn = Math.min(1, (progress - start) / edge);
  const fadeOut = Math.min(1, (end - progress) / edge);
  return Math.min(fadeIn, fadeOut);
}
