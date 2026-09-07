"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ensureGsap } from "@/lib/gsap";
import { setJourneyProgress } from "@/lib/journeyState";
import Scene from "./Scene";
import JourneyCurtain from "./JourneyCurtain";

const JOURNEY_HEIGHT_VH = 600;

export default function JourneyScroll({ children }: { children: React.ReactNode }) {
  const spacerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureGsap();
    const trigger = ScrollTrigger.create({
      trigger: spacerRef.current,
      start: "top top",
      end: "bottom bottom",
      // Was 0.6 — that's a fixed ~0.6s lag between raw scroll position and the progress this
      // drives, which barely registers across a whole 16%-wide dwell but is most of a narrow 5%
      // transit's own width. The camera cut would still be "arriving" a beat after the user had
      // already scrolled past it, reading as the flash hanging rather than snapping through.
      scrub: 0.2,
      onUpdate: (self) => setJourneyProgress(self.progress),
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
