import React from "react";
import { CtaButton } from "../ui/CtaButton";
import { Noise } from "../ui/Noise";
import { Reveal } from "../ui/Reveal";

export function PageHero({
  eyebrow,
  title,
  lead,
  cta = { label: "Send your sign photo", href: "/#contact" },
}) {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-32 right-[-15%] w-[520px] h-[520px] rounded-full opacity-60 blur-[110px]"
          style={{ background: "radial-gradient(circle, rgba(255,176,0,0.2), transparent 65%)" }}
        />
      </div>
      <Noise opacity={0.04} />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 pt-14 sm:pt-20 pb-12 sm:pb-16">
        <Reveal>
          <div className="font-mono-label text-xs tracking-[0.16em] text-amber mb-4">
            {eyebrow}
          </div>
          <h1 className="font-display font-extrabold text-[30px] sm:text-[44px] lg:text-[52px] leading-[1.12] sm:leading-[1.08] tracking-tight mb-5 text-balance">
            {title}
          </h1>
          <p className="text-base sm:text-lg leading-relaxed text-cloud mb-8 max-w-2xl">
            {lead}
          </p>
          <CtaButton href={cta.href}>{cta.label}</CtaButton>
        </Reveal>
      </div>
    </section>
  );
}
