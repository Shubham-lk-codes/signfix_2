import React from "react";
import { PlaceholderMedia } from "../ui/PlaceholderMedia";
import { Reveal } from "../ui/Reveal";

export function ContentBlock({
  title,
  children,
  tone = "paper",
  image,
}) {
  return (
    <section className={tone === "white" ? "bg-white border-y border-line" : ""}>
      <div
        className={`max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-14 ${
          image ? "grid gap-8 lg:gap-10 items-start grid-cols-1 lg:grid-cols-[1.2fr_1fr]" : ""
        }`}
      >
        <Reveal>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-ink mb-3.5">
            {title}
          </h2>
          <div className="text-[15px] sm:text-base leading-relaxed space-y-3.5">
            {children}
          </div>
        </Reveal>
        {image && (
          <Reveal delay={0.1}>
            <PlaceholderMedia label={image} tone="light" className="h-[220px] sm:h-[260px] p-4" />
          </Reveal>
        )}
      </div>
    </section>
  );
}
