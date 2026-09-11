import React from "react";
import { Search, ClipboardList, Hammer, PenTool, TestTube2 } from "lucide-react";
import { Eyebrow } from "../ui/Eyebrow";
import { CtaButton } from "../ui/CtaButton";
import { Reveal, RevealGroup, RevealItem } from "../ui/Reveal";

const steps = [
  { no: "1", icon: Search, title: "Inspect", body: "Sign, mounting, electrical condition, illumination, materials and overall appearance." },
  { no: "2", icon: ClipboardList, title: "Plan", body: "Separate essential repairs from optional upgrades; identify what is worth preserving." },
  { no: "3", icon: Hammer, title: "Rebuild", body: "Failed components repaired or replaced; damaged surfaces restored." },
  { no: "4", icon: PenTool, title: "Refinish", body: "Faces, graphics, letters and finishes refreshed where required." },
  { no: "5", icon: TestTube2, title: "Test", body: "Illumination, electrical connections and visual consistency checked before handover." },
];

export function Process() {
  return (
    <section id="process" className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-18 sm:py-24 scroll-mt-20">
      <Reveal className="max-w-2xl mb-10 sm:mb-12">
        <Eyebrow>THE SIGNFIX APPROACH</Eyebrow>
        <h2 className="font-display font-extrabold text-[28px] sm:text-[40px] leading-[1.12] sm:leading-[1.1] tracking-tight text-ink mb-4">
          Inspect. Plan. Rebuild. Refinish. Test.
        </h2>
        <p className="text-base sm:text-lg">
          We separate essential repairs from optional upgrades, and tell you which parts
          of your sign are worth preserving — instead of forcing one solution.
        </p>
      </Reveal>
      <RevealGroup className="grid gap-px bg-line border border-line rounded-xl overflow-hidden grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <RevealItem key={s.no}>
              <div className="group h-full bg-white p-6 sm:p-7 hover:bg-paper transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-display font-extrabold text-4xl text-amber leading-none">
                    {s.no}
                  </div>
                  <Icon size={20} strokeWidth={1.75} className="text-line group-hover:text-amber transition-colors" />
                </div>
                <h3 className="font-display font-bold text-[19px] text-ink mb-2">{s.title}</h3>
                <p className="text-[15px] leading-relaxed">{s.body}</p>
              </div>
            </RevealItem>
          );
        })}
      </RevealGroup>
      <Reveal delay={0.1} className="mt-5 sm:mt-6 bg-blue rounded-xl px-6 sm:px-8 py-6 sm:py-7 flex flex-wrap gap-4.5 items-center justify-between">
        <p className="text-white font-display font-semibold text-lg sm:text-xl max-w-3xl">
          Repair or replace? The cheapest component is not always the most economical
          answer. We explain the options after inspection.
        </p>
        <CtaButton href="/#contact">Book an inspection</CtaButton>
      </Reveal>
    </section>
  );
}
