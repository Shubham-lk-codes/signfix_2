import React from "react";
import { AlertTriangle } from "lucide-react";
import { Eyebrow } from "../ui/Eyebrow";
import { CtaButton } from "../ui/CtaButton";
import { PlaceholderMedia } from "../ui/PlaceholderMedia";
import { Noise } from "../ui/Noise";
import { Reveal } from "../ui/Reveal";

const faults = [
  "Completely dark",
  "Partially dark",
  "Flickering",
  "Too dim",
  "Brighter on one side",
  "Visible LED dots",
];

export function LedBanner() {
  return (
    <section id="led" className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-14 sm:py-20 scroll-mt-20">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-navy grid grid-cols-1 lg:grid-cols-2">
          <Noise opacity={0.04} />
          <div className="relative p-7 sm:p-11 lg:p-14">
            <Eyebrow>05 — LED SIGN REPAIR</Eyebrow>
            <h2 className="font-display font-extrabold text-[26px] sm:text-[38px] leading-[1.14] sm:leading-[1.1] tracking-tight text-white mb-4">
              The light is part of the sign
            </h2>
            <p className="text-cloud text-base sm:text-lg mb-7">
              Dark, patchy, flickering, dim or brighter on one side — these symptoms have
              different causes. We diagnose before we replace: LED modules, wiring,
              drivers, connections, moisture and physical damage.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-8">
              {faults.map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-white text-[15px] sm:text-base">
                  <AlertTriangle size={15} className="text-amber shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <CtaButton href="/#contact">Send a night + daylight photo</CtaButton>
          </div>
          <PlaceholderMedia
            label="PHOTO — channel letter opened up, LED modules being replaced"
            className="min-h-[220px] lg:min-h-[340px] border-t lg:border-t-0 lg:border-l border-navy-line rounded-none p-6"
          />
        </div>
      </Reveal>
    </section>
  );
}
