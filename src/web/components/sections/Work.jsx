import React from "react";
import { Zap, Sparkles, Layers } from "lucide-react";
import { Eyebrow } from "../ui/Eyebrow";
import { PlaceholderMedia } from "../ui/PlaceholderMedia";
import { Noise } from "../ui/Noise";
import { Reveal, RevealGroup, RevealItem } from "../ui/Reveal";

const categories = [
  {
    icon: Zap,
    tag: "LED SIGN REPAIR",
    title: "Diagnosing and fixing dark, flickering or uneven signage",
  },
  {
    icon: Sparkles,
    tag: "FULL RESTORATION",
    title: "Bringing an aged sign back to a professional standard",
  },
  {
    icon: Layers,
    tag: "MULTI-LOCATION ROLLOUT",
    title: "One master spec, fabricated and fitted across every outlet",
  },
];

export function Work() {
  return (
    <section id="work" className="relative bg-navy overflow-hidden scroll-mt-20">
      <Noise opacity={0.035} />
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-16 sm:py-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-5 mb-10">
          <div className="max-w-xl">
            <Eyebrow>21 — PROJECTS</Eyebrow>
            <h2 className="font-display font-extrabold text-[28px] sm:text-[40px] leading-[1.12] sm:leading-[1.1] tracking-tight text-white mb-3.5">
              Featured Signage Case Studies
            </h2>
            <p className="text-cloud text-base sm:text-lg">
              Detailed breakdown of how we diagnose failed signage, restore aged fascia, and manufacture specs for commercial brands.
            </p>
          </div>
        </Reveal>
        <RevealGroup className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <RevealItem key={c.tag}>
                <div className="group h-full rounded-xl overflow-hidden border border-navy-line bg-navy-soft hover:border-amber/60 transition-colors duration-300">
                  <PlaceholderMedia
                    label={c.tag}
                    className="h-[200px] sm:h-[220px] rounded-none border-0 p-0"
                  />
                  <div className="p-6">
                    <div className="flex items-center gap-2 font-mono-label text-[11px] tracking-[0.12em] text-amber mb-2.5">
                      <Icon size={13} />
                      {c.tag}
                    </div>
                    <h3 className="font-display font-bold text-lg sm:text-xl text-white leading-snug">
                      {c.title}
                    </h3>
                  </div>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
