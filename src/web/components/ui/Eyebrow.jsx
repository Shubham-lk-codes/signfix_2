import React from "react";

export function Eyebrow({ children, className = "" }) {
  return (
    <div
      className={`font-mono-label text-[11px] sm:text-xs tracking-[0.16em] uppercase text-amber mb-3 ${className}`}
    >
      {children}
    </div>
  );
}
