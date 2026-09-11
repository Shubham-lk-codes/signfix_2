import React, { useState } from "react";
import { Plus, Camera } from "lucide-react";
import { Eyebrow } from "../ui/Eyebrow";
import { Reveal, RevealGroup, RevealItem } from "../ui/Reveal";

const faqs = [
  {
    q: "Can you repair an existing LED sign board?",
    a: "Yes. We inspect LED modules, power supplies, wiring, connections, acrylic faces and related components, then recommend repair, replacement or an upgrade depending on condition.",
  },
  {
    q: "Do you repair signs made by another company?",
    a: "Yes. What matters is the current condition, construction, accessibility and repairability of the sign — not who built it.",
  },
  {
    q: "Can you make an old sign look new?",
    a: "In many cases, yes. Restoration may include new acrylic, LED replacement, graphics, refinishing, letter repair, cleaning and re-alignment.",
  },
  {
    q: "How do I know whether to repair or replace?",
    a: "It depends on structural condition, age, material, electrical system, visual condition and the cost of repeated repairs. We explain the practical options after inspection.",
  },
  {
    q: "Do you supply outside Hyderabad?",
    a: "Yes. Feasibility is assessed on product, quantity, destination and installation requirement. Name plates and selected products ship across India, and internationally where logistics permit.",
  },
  {
    q: "Can you replace only the LED modules?",
    a: "Where the sign construction allows it, LED modules can often be replaced without replacing the complete sign.",
  },
  {
    q: "Can you work with mall outlets?",
    a: "Yes. Mall projects are planned around approved drawings, access rules, installation windows and property requirements.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-18 sm:py-24 scroll-mt-20">
      <div className="grid gap-10 lg:gap-12 grid-cols-1 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal>
          <Eyebrow>22 — FAQ</Eyebrow>
          <h2 className="font-display font-extrabold text-[26px] sm:text-[38px] leading-[1.14] sm:leading-[1.1] tracking-tight text-ink mb-4">
            Useful answers before you request a quote
          </h2>
          <p className="text-[15px] sm:text-[17px] mb-6">
            You do not need to know technical signage terminology. A clear photograph and
            a simple explanation are enough to begin.
          </p>
          <div className="bg-white border border-line border-l-3 border-l-amber rounded-lg p-5.5">
            <div className="flex items-center gap-2 font-mono-label text-[11px] tracking-[0.12em] text-muted mb-2.5">
              <Camera size={13} />
              SEND FOR A QUOTATION
            </div>
            <p className="text-[15px] sm:text-base text-ink">
              Front photograph · side photograph · approximate width &amp; height ·
              location · business type · short description of the problem.
            </p>
          </div>
        </Reveal>
        <RevealGroup className="flex flex-col gap-2.5">
          {faqs.map((f, i) => {
            const open = openIndex === i;
            return (
              <RevealItem key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="w-full text-left bg-white border border-line hover:border-blue rounded-lg px-5 sm:px-5.5 py-4.5 sm:py-5 transition-colors cursor-pointer"
                  aria-expanded={open}
                >
                  <div className="flex gap-4 items-start justify-between">
                    <h3 className="font-display font-bold text-[15px] sm:text-[17px] text-ink">
                      {f.q}
                    </h3>
                    <Plus
                      size={18}
                      className={`shrink-0 text-amber mt-0.5 transition-transform duration-300 ${open ? "rotate-45" : ""}`}
                    />
                  </div>
                  <div
                    className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] mt-3.5 opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                  >
                    <p className="overflow-hidden text-[15px] sm:text-base leading-relaxed text-muted">
                      {f.a}
                    </p>
                  </div>
                </button>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
