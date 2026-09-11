import React from "react";
import { CheckCircle2 } from "lucide-react";
import { Eyebrow } from "../ui/Eyebrow";
import { PlaceholderMedia } from "../ui/PlaceholderMedia";
import { Reveal } from "../ui/Reveal";

const capabilities = [
  "Measurement & job prep",
  "Letter and panel fabrication",
  "Acrylic and sign-face prep",
  "Metal and frame fabrication",
  "Cutting and assembly",
  "LED installation & wiring",
  "Painting and finishing",
  "Testing and quality checks",
];

export function Fabrication() {
  return (
    <section className="bg-white border-b border-line">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-18 sm:py-24 grid gap-12 lg:gap-16 items-center grid-cols-1 lg:grid-cols-2">
        <Reveal>
          <Eyebrow>06 — IN-HOUSE FABRICATION</Eyebrow>
          <h2 className="font-display font-extrabold text-[26px] sm:text-[38px] leading-[1.14] sm:leading-[1.1] tracking-tight text-ink mb-4.5">
            Tools and machines are only useful when skilled people use them
          </h2>
          <p className="text-base sm:text-lg mb-6">
            Measuring, fabrication, cutting, assembly, LED installation, wiring,
            finishing, testing and dispatch — controlled in-house so issues are caught
            while the sign is still being made, not after it is on the building.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {capabilities.map((c) => (
              <div key={c} className="flex gap-2.5 items-start text-[15px] sm:text-base text-ink">
                <CheckCircle2 size={17} className="text-blue shrink-0 mt-0.5" strokeWidth={1.75} />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.12} className="grid grid-cols-2 gap-3.5">
          <PlaceholderMedia
            label="WORKSHOP — letter fabrication"
            tone="light"
            className="h-[170px] sm:h-[210px] p-3.5"
          />
          <PlaceholderMedia
            label="TEAM — LED wiring & testing"
            tone="light"
            className="h-[170px] sm:h-[210px] p-3.5 mt-6 sm:mt-7"
          />
        </Reveal>
      </div>
    </section>
  );
}
