"use client";

import { useEffect, useRef } from "react";
import { subscribeJourney, journeyState, transitCurtainOpacity } from "@/lib/journeyState";

/** Covers the 3D scene while the camera crosses a transit — the short scroll slice between two
 * stations where it moves at all. The camera still physically passes through the same geometry it
 * always did (a room's own back wall included), just quickly; this is what guarantees that moment
 * is never actually seen, regardless of how slowly someone scrolls through it.
 *
 * A flat black cover would read as the page glitching. Tinted warm-gold-to-leaf-green and slightly
 * soft at the edges, it reads instead as a breath of the same light already drifting through every
 * corridor (TransitGlow, Starfield) — this is that motif's other job, not a new visual language. */
export default function JourneyCurtain() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apply = (p: number) => {
      const el = ref.current;
      if (!el) return;
      const opacity = transitCurtainOpacity(p);
      el.style.opacity = String(opacity);
    };
    apply(journeyState.progress);
    return subscribeJourney(apply);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      data-journey-curtain
      className="pointer-events-none fixed inset-0 z-[5] opacity-0"
      style={{
        // Two layers, not one gradient. A gradient built entirely from rgba() stops is only ever
        // as opaque as its most transparent stop — the first version faded to 55% alpha right at
        // its own centre, exactly where the camera looks, so the room it was meant to hide showed
        // straight through the middle of the "cover" at full element opacity. The glow here is
        // still translucent rgba(), but it now sits on top of a second, solid, fully opaque fill —
        // painted first in the list, CSS paints backgrounds top-to-bottom — that alone guarantees
        // nothing behind the curtain is ever visible, regardless of what the glow layer is doing.
        // Gold core fading through leaf-green is the same two tones TransitGlow and Starfield
        // already use in every corridor, just concentrated into one full-screen breath here.
        background:
          "radial-gradient(circle at 50% 50%, rgba(201,162,75,0.6) 0%, rgba(111,156,79,0.32) 35%, rgba(11,9,8,0) 72%), #0b0908",
      }}
    />
  );
}
