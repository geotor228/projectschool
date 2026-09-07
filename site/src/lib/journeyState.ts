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

/** True for the fixed duration of a station-to-station jump — see JourneyScroll.tsx, which is what
 * actually flips this (and locks the page's own scroll) whenever progress crosses a transit
 * boundary. Separate from `progress` itself: progress still advances smoothly underneath (driven by
 * a fixed-duration tween instead of the scrollbar while this is true), but nothing that cares about
 * *whether a jump is in flight* — right now, only the portal overlay — needs to also re-derive that
 * from the progress segments math. */
export const journeyTransitionState = { active: false };
const transitionListeners = new Set<(active: boolean) => void>();
export function subscribeTransitioning(fn: (active: boolean) => void): () => void {
  transitionListeners.add(fn);
  return () => transitionListeners.delete(fn);
}
export function setTransitioning(active: boolean) {
  journeyTransitionState.active = active;
  transitionListeners.forEach((fn) => fn(active));
}

/** Wall-clock length of the locked jump between two stations — fast, like a cut, never scroll-
 * scrubbed. See JourneyScroll.tsx for how this is actually driven. */
export const TRANSIT_DURATION_MS = 380;

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

/** The 4 transit windows as plain [start,end] ranges — JourneyScroll.tsx reads this to notice when
 * scroll-driven progress is about to cross into one, so it can take over with a fixed-duration
 * locked jump instead of letting the scrollbar scrub through it. */
export const TRANSIT_RANGES: readonly (readonly [number, number])[] = SEGMENTS.filter(
  (s): s is TransitSegment => s.kind === "transit",
).map((s) => [s.start, s.end] as const);

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

/** Every room tour has exactly this many waypoints: 3 "view" stops (no card — just something worth
 * looking at) at even indices and 3 "text" stops (one card each, in dwell order) at odd indices.
 * SceneCards.tsx picks indices 1/3/5 out of `splitIntoStops(window, STOPS_PER_ROOM)` to line a
 * card's own visible range up with the exact stop its camera pose corresponds to below. */
export const STOPS_PER_ROOM = 6;

/**
 * Camera tours through the 3 "room" scenes: 6 waypoints each, alternating a wide/establishing or
 * pure "look at this" beat (indices 0, 2, 4 — no card ever shows here) with a beat that carries one
 * of the room's 3 cards (indices 1, 3, 5). Coordinates are hand-placed against each scene's actual
 * geometry in Scene.tsx (see the position props there), converted to world space by adding that
 * scene's own group offset.
 *
 * Every one of these was checked against the room's actual geometry for viewing distance — the
 * previous 3-point version put the classroom's board stop only ~2.2 units from a 7-unit-wide board
 * (close enough that its own accent strip, a thin horizontal highlight, foreshortened into what
 * read as a stray diagonal streak across the frame) and the lab's ultrasonic-bath stop only ~2.3
 * units from a small box viewed at a steep downward tilt — both far too tight to read as anything
 * but a confusing, disorienting close-up. Every stop here sits at least ~3.3 units from whatever
 * it's framing, with a downward tilt kept under ~35° so the subject and its surroundings both stay
 * legible.
 *
 * These don't need to start and end pinned to a "neutral" pose — that constraint existed only for
 * the old scroll-scrubbed curtain, which the fully-opaque locked portal transition replaced (see
 * JourneyScroll.tsx/JourneyCurtain.tsx): the screen is completely covered for the whole jump, so it
 * no longer matters where a tour starts or ends.
 *
 * Waypoints are spaced through `stopEase` (below) rather than fed straight to the spline at a
 * uniform rate: that reparametrization holds the camera's velocity at ~0 for a moment exactly at
 * each of the 6 stops (so a stop actually reads as a brief pause to look, not a blur passing
 * through) while keeping the *path* itself one continuous Catmull-Rom curve, so the glide between
 * stops stays smooth rather than a series of dead-stop-then-lurch cuts.
 */
const TOURS: Partial<Record<StationKey, CameraPose[]>> = {
  classroom: [
    // Stop 0 (view): pulled back and slightly raised — the whole room (desks, board, side walls,
    // corkboard) in frame at once, the establishing shot on arrival.
    { pos: [0, 1.7, -9.5], look: [0, 1.3, -17] },
    // Stop 1 (card "Запах — это химия"): a modest lean in over the desks, still wide.
    { pos: [0.4, 1.55, -12], look: [0, 1.3, -16.5] },
    // Stop 2 (view): a look down at a student desk's own clutter — books, a stray pencil.
    { pos: [-1.3, 1.35, -13.5], look: [-1.3, 0.65, -15.6] },
    // Stop 3 (card "Один цветок, два способа"): lean toward the wall poster/corkboard (world
    // x≈6-7 side) — unchanged from before; this framing was never the problem.
    { pos: [1.7, 1.3, -15], look: [3.8, 1.4, -17.2] },
    // Stop 4 (view): the whole blackboard, clean and comfortably back from it (~5.5 units, not the
    // ~2.2 that used to make its accent strip read as a stray diagonal line) — enough to actually
    // read the lesson on it.
    { pos: [0, 1.6, -14.5], look: [0, 1.7, -19.5] },
    // Stop 5 (card "Что всё решает"): a little closer to the board (~4 units) for the closing beat,
    // but never nose-to-nose with it.
    { pos: [0, 1.5, -16], look: [0, 1.6, -19.5] },
  ],
  lab: [
    // Stop 0 (view): pulled back, the whole bench and both apparatus visible.
    { pos: [0, 1.7, -29.5], look: [0, 1.3, -37] },
    // Stop 1 (card "Два стакана, одна гипотеза"): both setups (the flask/condenser and the
    // ultrasonic bath) framed together, since the card is explicitly about the two side by side.
    { pos: [0.3, 1.5, -32], look: [0, 1.1, -35.3] },
    // Stop 2 (view): the glassware rack — turned into a genuine "look at this" beat instead of an
    // accidental close swing through it mid-transit.
    { pos: [-2.2, 1.4, -30.5], look: [-4.72, -0.2, -32.2] },
    // Stop 3 (card "+114%"): the ultrasonic bath, pulled back to ~4.4 units at a ~29° tilt — close
    // enough to read its panel, far enough that it isn't a wall of dark plastic filling the frame.
    { pos: [-0.5, 1.6, -31.5], look: [-2.3, -0.5, -34.9] },
    // Stop 4 (view): the periodic table, dead-on and comfortably back (~5.5 units from the wall).
    { pos: [-0.6, 1.6, -38.5], look: [-0.6, 1.5, -44] },
    // Stop 5 (card "Но почему это вообще работает?"): the terpene-structures wall chart specifically
    // (world ≈ [-3.85, 0.45, -43.93]) — bridges toward the molecule room next door.
    { pos: [-2.5, 1.4, -39], look: [-3.85, 0.7, -43.9] },
  ],
  molecule: [
    // Stop 0 (view): pulled back, the whole room visible.
    { pos: [0, 1.7, -49.5], look: [0, 1.3, -57] },
    // Stop 1 (card "Нос умнее, чем кажется"): straight down the room's central aisle, monitors
    // flanking either side — the card's text isn't about one specific prop, so this just keeps
    // moving forward through the space rather than leaning at anything in particular.
    { pos: [0, 1.6, -52], look: [0, 1.1, -58] },
    // Stop 2 (view): the right-hand bench's centrifuge and robotic arm at work.
    { pos: [3.0, 1.35, -54.5], look: [4.9, -0.3, -52.3] },
    // Stop 3 (card "Взрыв внутри пузырька"): the central island bench.
    { pos: [-1.1, 1.25, -54.7], look: [-1.9, 0.75, -58.3] },
    // Stop 4 (view): the server racks and control consoles further back in the room.
    { pos: [1.5, 1.6, -59], look: [4.5, -0.8, -60.5] },
    // Stop 5 (card "Осталось проверить на практике"): the molecule exhibit on its lit plinth (world
    // ≈ [2.45, ·, -57.9]) — the room's own centrepiece, and the last thing seen before the portal.
    { pos: [1.5, 1.3, -55.5], look: [2.3, 1.0, -57.5] },
  ],
};

// Catmull-Rom through 4 scalars at local t∈[0,1] — standard form, unit tension.
function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

// Samples a Catmull-Rom spline through `points` at global u∈[0,1]. Endpoints are clamped (the first
// and last point are effectively repeated), which has the pleasant side effect of easing velocity
// toward zero at the very start/end of the path without needing an explicit matching keyframe there.
function splineAt(points: number[], u: number): number {
  const n = points.length;
  if (n === 0) return 0;
  if (n === 1) return points[0];
  if (n === 2) return lerp(points[0], points[1], clamp01(u));
  const segCount = n - 1;
  const scaled = clamp01(u) * segCount;
  const i = Math.min(Math.floor(scaled), segCount - 1);
  const t = scaled - i;
  const at = (idx: number) => points[Math.max(0, Math.min(n - 1, idx))];
  return catmullRom(at(i - 1), at(i), at(i + 1), at(i + 2), t);
}

function splinePoseAt(poses: CameraPose[], u: number): CameraPose {
  const channel = (pick: (p: CameraPose) => readonly number[], idx: number) => splineAt(poses.map((p) => pick(p)[idx]), u);
  return {
    pos: [channel((p) => p.pos, 0), channel((p) => p.pos, 1), channel((p) => p.pos, 2)],
    look: [channel((p) => p.look, 0), channel((p) => p.look, 1), channel((p) => p.look, 2)],
  };
}

/** Reparametrizes global t∈[0,1] so the *spatial* spline (still one continuous Catmull-Rom curve —
 * see `splineAt`) is sampled at a non-uniform rate: velocity eases to ~0 exactly at each of the `n`
 * keyframes (t = i/(n-1)) via a per-segment smoothstep, then eases back up to glide to the next one.
 * This is what turns each waypoint into an actual brief stop — long enough to read a card or take in
 * a view — instead of a point the camera merely passes through at speed. Applying the ease to the
 * *parametrization* rather than building it out of separate linear segments (the very first version
 * of this tour system) keeps the path itself smooth throughout; only the pacing along it changes. */
function stopEase(t: number, n: number): number {
  if (n <= 1) return 0;
  const segCount = n - 1;
  const scaled = clamp01(t) * segCount;
  const i = Math.min(Math.floor(scaled), segCount - 1);
  const local = scaled - i;
  return (i + smooth(local)) / segCount;
}

/** The camera pose for a station's tour at a given point through its dwell (0→1), or null for a
 * station with no tour defined (hero, horizon — deliberately untouched) so CameraRig can fall back
 * to the plain neutral formula it always used. */
export function tourPoseAt(key: StationKey, dwellLocal: number): CameraPose | null {
  const poses = TOURS[key];
  if (!poses || poses.length === 0) return null;
  return splinePoseAt(poses, stopEase(clamp01(dwellLocal), poses.length));
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

/** One narrow sub-window per tour stop (see `STOPS_PER_ROOM`/`TOURS`), centered on that stop's
 * actual `stopEase` hold point (k/(n-1) of the dwell) rather than on an unrelated equal-`n`-way
 * division of the whole dwell — those are NOT the same thing, and conflating them was a real bug:
 * with `n` holds spaced 1/(n-1) apart but the dwell naively cut into `n` equal 1/n-wide slices, a
 * card's slice and its camera's hold point drift apart more with every stop (by stop 5 of 6, the
 * hold sits at the very *edge* of an equal-slice division rather than its centre), so a card could
 * already be showing while the camera was still mid-flight between the *previous* stop and this
 * one — confirmed from a production screenshot where the last card of a room ("Осталось проверить
 * на практике") was on screen over a nonsensical, extremely-close view that turned out to be the
 * tail end of the camera still swinging in from the stop before it.
 *
 * Each window spans only the quarter-segment on either side of its hold point — the part of that
 * segment's smoothstep ease where velocity is already lowest, i.e. where the camera is genuinely
 * close to settled — clamped to the dwell's own [0,1] ends for the first and last stop. This also
 * happens to suit the "quick appear, quick disappear" the card redesign wants: a card is only ever
 * on screen for the actual hold, not the glide on either side of it. */
export function splitIntoStops(
  { start, end }: { start: number; end: number },
  n: number,
): Array<readonly [number, number]> {
  const width = end - start;
  const segWidth = n > 1 ? 1 / (n - 1) : 1;
  const quarter = segWidth / 4;
  return Array.from({ length: n }, (_, k) => {
    const hold = n > 1 ? k / (n - 1) : 0;
    const lo = k === 0 ? 0 : hold - quarter;
    const hi = k === n - 1 ? 1 : hold + quarter;
    return [start + lo * width, start + hi * width] as const;
  });
}

/** Opacity for one of a scene's cards: fades in over the first `edge` of its own range and out over
 * the last `edge`, but — unlike chapterOpacity — never reads outside [start,end] at all, not even by
 * `edge`. A card's range is now one narrow stop-slice (see `splitIntoStops`) rather than a full third
 * of the dwell, and `edge` is kept small relative to that slice on purpose: the whole point of the
 * "stops" redesign is that a card reads as present-then-gone at a specific point the camera pauses
 * at, not a slow crossfade spread across most of the room's scroll range the way the original 3-card
 * system had it (which is also where the original overlap bug came from — two adjacent ranges both
 * padding a fade past their shared boundary, so their text sat on top of each other for a moment on
 * every transition; keeping every card's own fade strictly inside its own range is what fixed that,
 * and still does here). */
export function cardOpacity(progress: number, [start, end]: readonly [number, number], edge = 0.003): number {
  if (progress <= start || progress >= end) return 0;
  const fadeIn = Math.min(1, (progress - start) / edge);
  const fadeOut = Math.min(1, (end - progress) / edge);
  return Math.min(fadeIn, fadeOut);
}
