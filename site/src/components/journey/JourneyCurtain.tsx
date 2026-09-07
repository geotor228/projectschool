"use client";

import { useEffect, useState } from "react";
import { subscribeTransitioning, journeyTransitionState } from "@/lib/journeyState";

/**
 * The portal between stations — plays once, in full, every time `journeyTransitionState.active`
 * flips true (JourneyScroll.tsx is what flips it, exactly when it locks the page's own scroll for
 * the fixed-duration jump between two stations; see globals.css for the actual @keyframes).
 *
 * This used to be a curtain whose opacity was a continuous function of scroll progress — which is
 * exactly what let it be paused mid-fade by simply not scrolling any further, the "stuck in the
 * flash" complaint. Driven by a boolean instead of by progress, and by a plain CSS animation instead
 * of a per-frame opacity calculation, it can't be paused: once `.portal-active` is applied, the
 * animation runs to completion under its own steam regardless of what scrolling does or doesn't do
 * in the meantime (which, for the record, is also locked out for the same duration — see
 * JourneyScroll.tsx).
 *
 * `.portal-cover` is a plain solid fill, not a gradient — unlike the old curtain, there's no risk of
 * a gradient stop's own alpha leaving the centre of the screen translucent, because nothing here
 * relies on gradient alpha to be the *only* thing standing between the viewer and the 3D scene.
 * `.portal-ring`/`.portal-swirl` are purely decorative, layered on top once the cover already
 * guarantees full opacity — a swirling energy-gate look inspired by the generic "glowing portal"
 * trope common across sci-fi, built from scratch as CSS gradients rather than referencing any one
 * show's specific design.
 */
export default function JourneyCurtain() {
  const [active, setActive] = useState(journeyTransitionState.active);

  useEffect(() => subscribeTransitioning(setActive), []);

  return (
    <div aria-hidden data-journey-portal className={`pointer-events-none fixed inset-0 z-[5] ${active ? "portal-active" : ""}`}>
      <div className="portal-cover absolute inset-0 opacity-0" style={{ background: "#0b0908" }} />
      <div
        className="portal-ring absolute top-1/2 left-1/2 opacity-0"
        style={{
          width: "70vmin",
          height: "70vmin",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(212,175,55,0.92) 0%, rgba(201,162,75,0.55) 32%, rgba(111,156,79,0.38) 58%, rgba(11,9,8,0) 76%)",
        }}
      >
        <div
          className="portal-swirl absolute inset-0"
          style={{
            borderRadius: "50%",
            background:
              "conic-gradient(from 0deg, rgba(212,175,55,0.55), rgba(111,156,79,0.18), rgba(212,175,55,0.5), rgba(122,46,58,0.32), rgba(212,175,55,0.55))",
            mixBlendMode: "screen",
          }}
        />
      </div>
    </div>
  );
}
