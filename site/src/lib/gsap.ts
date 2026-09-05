"use client";

import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

export function ensureGsap() {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return gsap;
}

/** Fades + lifts children of `selector` inside `ref` as they enter the viewport. Skipped entirely under reduced motion. */
export function useRevealChildren(
  ref: RefObject<HTMLElement | null>,
  selector: string,
) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const g = ensureGsap();
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const targets = root.querySelectorAll<HTMLElement>(selector);
      const triggers = Array.from(targets).map((el) =>
        g.from(el, {
          opacity: 0,
          y: 24,
          duration: 0.5,
          ease: "power1.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        }),
      );
      return () => triggers.forEach((t) => t.scrollTrigger?.kill());
    });

    return () => mm.revert();
  }, [ref, selector]);
}

export function useScrollProgress() {
  const progressRef = useRef(0);
  useEffect(() => {
    const g = ensureGsap();
    const st = ScrollTrigger.create({
      start: 0,
      end: () => document.documentElement.scrollHeight - window.innerHeight,
      onUpdate: (self) => {
        progressRef.current = self.progress;
        document.documentElement.style.setProperty(
          "--scroll-progress",
          String(self.progress),
        );
      },
    });
    return () => st.kill();
  }, []);
}
