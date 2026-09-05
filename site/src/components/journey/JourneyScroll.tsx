"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ensureGsap } from "@/lib/gsap";
import { setJourneyProgress } from "@/lib/journeyState";
import Scene from "./Scene";

const JOURNEY_HEIGHT_VH = 600;

export default function JourneyScroll({ children }: { children: React.ReactNode }) {
  const spacerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureGsap();
    const trigger = ScrollTrigger.create({
      trigger: spacerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
      onUpdate: (self) => setJourneyProgress(self.progress),
    });
    return () => trigger.kill();
  }, []);

  return (
    <div ref={spacerRef} style={{ height: `${JOURNEY_HEIGHT_VH}vh` }} className="relative">
      <div className="fixed inset-0 -z-10">
        <Scene />
      </div>
      {children}
    </div>
  );
}
