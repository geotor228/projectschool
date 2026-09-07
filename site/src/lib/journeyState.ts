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

/** Which dwell `p` currently sits in, and how far through it (0→1) — null while in a transit. This
 * is what the per-station camera tour below is driven from: not the card thirds (which exist for
 * card fade timing only), but a continuous 0→1 sweep across the *entire* dwell, so the camera's own
 * motion doesn't have to line up with exactly 3 equal segments. */
export function dwellInfoForProgress(p: number): { key: StationKey; local: number } | null {
  const cp = clamp01(p);
  for (const seg of SEGMENTS) {
    if (cp <= seg.end + 1e-9) {
      if (seg.kind !== "dwell") return null;
      const local = seg.end === seg.start ? 1 : clamp01((cp - seg.start) / (seg.end - seg.start));
      return { key: seg.key, local };
    }
  }
  return null;
}

export type CameraPose = { pos: readonly [number, number, number]; look: readonly [number, number, number] };
type TourKeyframe = { at: number; pose: CameraPose };

const neutralPose = (stationZ: number): CameraPose => ({ pos: [0, 1.2, stationZ], look: [0, 1, stationZ - 5] });

/**
 * Camera tours through the 3 "room" scenes — a real walk from one point of interest to the next
 * (a desk, a wall poster, the board; the bench, the ultrasonic bath, the wall chart; and so on)
 * instead of one fixed parked shot for the whole dwell. Coordinates are hand-placed against each
 * scene's actual geometry in Scene.tsx (see the position props there), converted to world space by
 * adding that scene's own group offset.
 *
 * Every tour's first and last keyframe (at 0 and at 1) is exactly neutralPose(STATIONS[key]) — the
 * same position and look-target cameraZForProgress/CameraRig already hand off to and expect back at
 * a transit boundary. That's not a stylistic choice, it's the thing that makes this safe to add at
 * all: a transit always lerps from/to STATIONS[from]/STATIONS[to] with the plain forward look, so if
 * a tour left the camera anywhere else at the exact moment a dwell ends, the next frame (now inside
 * the transit) would snap back to that neutral pose — a visible pop, right as the curtain is only
 * just starting to cover the screen. Only the interior keyframes are free to wander toward whatever
 * that scene's card is actually about; the walk always eases back to neutral by the time it hands
 * off. `at` values sit close to each card's own midpoint (see splitIntoThirds) but don't have to
 * match it exactly — the camera's arrival and the card's own fade are two independent systems that
 * only need to roughly agree, not lock-step.
 */
const TOURS: Partial<Record<StationKey, TourKeyframe[]>> = {
  classroom: [
    { at: 0, pose: neutralPose(STATIONS.classroom) },
    // Card 1 "Запах — это химия": the desks are already what the neutral forward view frames.
    { at: 0.16, pose: neutralPose(STATIONS.classroom) },
    // Card 2 "Один цветок, два способа": lean toward the wall poster (world ≈ [6.85, 1.6, -17.4]) —
    // a partial turn, not a snap to face it dead-on.
    { at: 0.5, pose: { pos: [1.6, 1.3, -15], look: [3.6, 1.4, -17] } },
    // Card 3 "Что всё решает": creep toward the blackboard (world ≈ [0, 1.7, -20]).
    { at: 0.82, pose: { pos: [0, 1.25, -15.8], look: [0, 1.6, -19.5] } },
    { at: 1, pose: neutralPose(STATIONS.classroom) },
  ],
  lab: [
    { at: 0, pose: neutralPose(STATIONS.lab) },
    // Card 1 "Два стакана, одна гипотеза": the whole bench, neutral forward view.
    { at: 0.16, pose: neutralPose(STATIONS.lab) },
    // Card 2 "+114%": lean toward the ultrasonic bath (world ≈ [-2.3, -0.85, -33.6]).
    { at: 0.5, pose: { pos: [-1.3, 1.25, -34.6], look: [-1.9, 0.9, -34] } },
    // Card 3 "Но почему это вообще работает?": glance up at the wall charts behind the bench.
    { at: 0.82, pose: { pos: [0, 1.25, -35.5], look: [-0.5, 1.4, -40] } },
    { at: 1, pose: neutralPose(STATIONS.lab) },
  ],
  molecule: [
    { at: 0, pose: neutralPose(STATIONS.molecule) },
    // Card 1 "Нос умнее, чем кажется": the room's neutral overview.
    { at: 0.16, pose: neutralPose(STATIONS.molecule) },
    // Card 2 "Взрыв внутри пузырька": lean toward the central island bench (world ≈ [-0.4,·,-59.6]).
    { at: 0.5, pose: { pos: [-0.9, 1.25, -54.6], look: [-1.6, 0.7, -58] } },
    // Card 3 "Осталось проверить на практике": the molecule exhibit itself (world ≈ [2.45,·,-57.9]).
    { at: 0.82, pose: { pos: [1.3, 1.25, -55.2], look: [1.9, 0.7, -57.2] } },
    { at: 1, pose: neutralPose(STATIONS.molecule) },
  ],
};

function lerpPose(a: CameraPose, b: CameraPose, t: number): CameraPose {
  const st = smooth(t);
  const l3 = (p: readonly [number, number, number], q: readonly [number, number, number]): [number, number, number] => [
    lerp(p[0], q[0], st),
    lerp(p[1], q[1], st),
    lerp(p[2], q[2], st),
  ];
  return { pos: l3(a.pos, b.pos), look: l3(a.look, b.look) };
}

/** The camera pose for a station's tour at a given point through its dwell (0→1), or null for a
 * station with no tour defined (hero, horizon — deliberately untouched) so CameraRig can fall back
 * to the plain neutral formula it always used. */
export function tourPoseAt(key: StationKey, dwellLocal: number): CameraPose | null {
  const kfs = TOURS[key];
  if (!kfs || kfs.length === 0) return null;
  const t = clamp01(dwellLocal);
  for (let i = 0; i < kfs.length - 1; i++) {
    if (t <= kfs[i + 1].at || i === kfs.length - 2) {
      const span = kfs[i + 1].at - kfs[i].at;
      const localT = span === 0 ? 1 : clamp01((t - kfs[i].at) / span);
      return lerpPose(kfs[i].pose, kfs[i + 1].pose, localT);
    }
  }
  return kfs[kfs.length - 1].pose;
}

/** Opacity for a full-screen curtain that covers the scene during a transit and clears during a
 * dwell, with a short soft edge so it fades rather than snaps. The camera still physically crosses
 * the same stretch of geometry it always did between two stations (a room's own back wall included)
 * — compressing that crossing into a short slice of scroll makes it quick, but doesn't guarantee a
 * slow, deliberate scroll (a dragged scrollbar, a hesitant trackpad) can't still linger inside it
 * and show the clipping. The curtain is what actually guarantees that moment is never seen.
 *
 * `edge` is deliberately tight: an earlier, wider edge combined with the scroll's own smoothing lag
 * (see JourneyScroll's scrub) made the curtain feel like it hung around rather than snapping through
 * — "stuck in the flash". A short edge means most of the already-narrow transit is spent fully
 * opaque rather than fading, so the cut reads as quick regardless of how that lag behaves. */
export function transitCurtainOpacity(p: number, edge = 0.006): number {
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
