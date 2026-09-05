"use client";

import { useScrollProgress } from "@/lib/gsap";

export default function ScrollProgress() {
  useScrollProgress();

  return (
    <div
      className="fixed top-0 left-0 z-50 h-1 w-full bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full origin-left bg-accent transition-transform duration-100"
        style={{
          transform: "scaleX(var(--scroll-progress, 0))",
          backgroundColor: "var(--color-accent)",
        }}
      />
    </div>
  );
}
