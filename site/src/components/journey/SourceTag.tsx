"use client";

import { useState, type ReactNode } from "react";

export default function SourceTag({
  citation,
  detail,
  children,
}: {
  citation: string;
  detail: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="cursor-pointer border-b border-dotted font-mono text-xs"
        style={{ color: "var(--color-primary)", borderColor: "var(--color-primary)" }}
        aria-expanded={open}
      >
        {children}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-0 z-20 mb-2 w-64 rounded-xl border p-3 text-xs leading-relaxed shadow-lg"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
            color: "var(--color-foreground)",
          }}
        >
          <span className="mb-1 block font-medium" style={{ color: "var(--color-accent)" }}>
            {citation}
          </span>
          {detail}
        </span>
      )}
    </span>
  );
}
