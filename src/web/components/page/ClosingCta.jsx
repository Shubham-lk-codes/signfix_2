import React from "react";
import { CtaButton } from "../ui/CtaButton";
import { Noise } from "../ui/Noise";
import { Reveal } from "../ui/Reveal";

export function ClosingCta({
  text,
  cta = { label: "Send your sign photo", href: "/#contact" },
}) {
  return (
    <section className="relative overflow-hidden bg-navy">
      <Noise opacity={0.04} />
      <Reveal className="relative max-w-6xl mx-auto px-4 sm:px-8 py-14 sm:py-18 flex flex-wrap items-center justify-between gap-6">
        <p className="font-display font-bold text-xl sm:text-2xl text-white max-w-xl text-balance">
          {text}
        </p>
        <CtaButton href={cta.href}>{cta.label}</CtaButton>
      </Reveal>
    </section>
  );
}
