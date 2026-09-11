import React from "react";
import { CheckCircle2 } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "../ui/Reveal";

export function FeatureGrid({
  eyebrow,
  title,
  items,
  columns = 2,
}) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
      <Reveal className="mb-8">
        {eyebrow && (
          <div className="font-mono-label text-xs tracking-[0.16em] text-amber mb-3">
            {eyebrow}
          </div>
        )}
        <h2 className="font-display font-extrabold text-2xl sm:text-[32px] leading-[1.15] tracking-tight text-ink">
          {title}
        </h2>
      </Reveal>
      <RevealGroup
        className={`grid gap-3.5 grid-cols-1 sm:grid-cols-2 ${columns === 3 ? "lg:grid-cols-3" : ""}`}
      >
        {items.map((item) => (
          <RevealItem key={item}>
            <div className="flex items-start gap-3 bg-white border border-line rounded-lg px-4.5 py-4 h-full">
              <CheckCircle2 size={18} className="text-blue shrink-0 mt-0.5" strokeWidth={1.75} />
              <span className="text-[15px] sm:text-base text-ink leading-snug">{item}</span>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
