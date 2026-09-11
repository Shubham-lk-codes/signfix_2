import React from "react";
import { Reveal } from "../ui/Reveal";

const audiences = [
  "Corporate Offices",
  "Malls",
  "Restaurants",
  "Retail Chains",
  "Showrooms",
  "Property Managers",
];

export function TrustBar() {
  return (
    <div className="bg-white border-b border-line">
      <Reveal className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-5 sm:py-5.5 flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
        <span className="font-mono-label text-xs tracking-[0.12em] text-muted">
          WE WORK WITH
        </span>
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 font-display font-bold text-xs sm:text-sm tracking-[0.08em] uppercase text-ink">
          {audiences.map((a, i) => (
            <span key={a} className="flex items-center gap-3.5">
              {i > 0 && <span className="text-line">/</span>}
              {a}
            </span>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
