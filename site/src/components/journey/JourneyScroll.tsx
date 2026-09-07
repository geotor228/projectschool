"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ensureGsap } from "@/lib/gsap";
import { setJourneyProgress, setTransitioning, TRANSIT_RANGES, TRANSIT_DURATION_MS } from "@/lib/journeyState";
import Scene from "./Scene";
import JourneyCurtain from "./JourneyCurtain";

const JOURNEY_HEIGHT_VH = 600;

/** Which transit range (if any) does the step from `from` to `to` cross — forward through its
 * start, or backward through its end? Progress moves in small steps under normal scrolling, so this
 * only ever needs to catch one boundary per call; see runLockedJump's own comment for what happens
 * on a scroll big enough to skip past more than one in a single tick (a scrollbar drag, Home/End). */
function findCrossedTransit(from: number, to: number): readonly [number, number] | null {
  for (const [start, end] of TRANSIT_RANGES) {
    if ((from < start && to >= start) || (from > end && to <= end)) return [start, end];
  }
  return null;
}

export default function JourneyScroll({ children }: { children: React.ReactNode }) {
  const spacerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const gsap = ensureGsap();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Under reduced motion the CSS side of the portal collapses to ~0 (globals.css's blanket
    // animation-duration override), but the *lock* itself is timed in JS — without shortening this
    // too, the page would sit inertly locked for the full normal duration with nothing to look at.
    const jumpSeconds = (reduceMotion ? 60 : TRANSIT_DURATION_MS) / 1000;

    let locked = false;
    let prevProgress = 0;

    const scrollYForProgress = (p: number) => {
      const doc = document.documentElement;
      return p * (doc.scrollHeight - window.innerHeight);
    };

    /**
     * A transit used to be scroll-scrubbed — progress moved through it exactly as fast as the user
     * scrolled, which is also what let it be "stopped" mid-flight by simply not scrolling further.
     * This instead locks the page's own scroll (wheel, touch, keyboard, a dragged scrollbar — all of
     * it, via overflow:hidden rather than chasing every input type individually) and drives progress
     * across the transit with a fixed-duration tween that always runs to completion under its own
     * steam. Scroll resumes only once the jump has actually landed — the site is meant to read as a
     * strictly forward, point-to-point journey, and a jump that could be interrupted or reversed
     * mid-flight undermines exactly that.
     */
    const runLockedJump = ([start, end]: readonly [number, number], direction: "forward" | "backward") => {
      locked = true;
      setTransitioning(true);

      const from = direction === "forward" ? start : end;
      const to = direction === "forward" ? end : start;

      // Snap the *actual* scroll position to the transit's near edge before locking — otherwise the
      // frozen scroll position could sit a little past where progress=from truly is, and scrolling
      // would resume from a slightly different spot than the tween below started from.
      window.scrollTo(0, scrollYForProgress(from));
      prevProgress = from;
      setJourneyProgress(from);

      const html = document.documentElement;
      const body = document.body;
      const prevHtmlOverflow = html.style.overflow;
      const prevBodyOverflow = body.style.overflow;
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";

      const proxy = { p: from };
      gsap.to(proxy, {
        p: to,
        duration: jumpSeconds,
        ease: "power2.inOut",
        onUpdate: () => setJourneyProgress(proxy.p),
        onComplete: () => {
          html.style.overflow = prevHtmlOverflow;
          body.style.overflow = prevBodyOverflow;
          window.scrollTo(0, scrollYForProgress(to));
          prevProgress = to;
          setJourneyProgress(to);
          setTransitioning(false);
          locked = false;
        },
      });
    };

    const trigger = ScrollTrigger.create({
      trigger: spacerRef.current,
      start: "top top",
      end: "bottom bottom",
      // Was 0.6, then 0.2 — a fixed lag between raw scroll position and the progress it drives.
      // Transits are no longer scroll-scrubbed at all (see runLockedJump above), but dwells still
      // are, and a little more lag than the snappiest possible setting takes the edge off scrolling
      // in discrete mouse-wheel notches: each notch's jump in raw scroll position gets smoothed into
      // the same continuous glide the camera tour itself now eases through (see `stopEase` in
      // journeyState.ts), instead of the camera visibly hopping frame to frame with the wheel.
      scrub: 0.35,
      onUpdate: (self) => {
        if (locked) return; // the locked tween owns progress right now; ignore stray scroll updates
        const p = self.progress;
        const crossing = findCrossedTransit(prevProgress, p);
        if (crossing) {
          // A single scroll step big enough to skip past more than one transit at once (a scrollbar
          // dragged straight from top to bottom, Home/End) only triggers the first one crossed here
          // — but since prevProgress lands at that transit's own far edge rather than jumping to
          // wherever the scrollbar actually ended up, the very next onUpdate (scroll settled at that
          // distant target) re-evaluates from there and catches the next one, and so on: a rapid
          // cascade of jumps rather than one, not a skip. Acceptable for a rare, deliberate gesture.
          runLockedJump(crossing, p >= prevProgress ? "forward" : "backward");
        } else {
          setJourneyProgress(p);
        }
        prevProgress = p;
      },
    });
    return () => trigger.kill();
  }, []);

  return (
    <div ref={spacerRef} style={{ height: `${JOURNEY_HEIGHT_VH}vh` }} className="relative">
      <div className="fixed inset-0 -z-10">
        <Scene />
        <JourneyCurtain />
      </div>
      {children}
    </div>
  );
}
