import React from "react";
import Link from "../ui/Link";
import { Wrench, Sparkles, Zap, Factory, IdCard, Settings2 } from "lucide-react";
import { Eyebrow } from "../ui/Eyebrow";
import { Reveal, RevealGroup, RevealItem } from "../ui/Reveal";

const services = [
  {
    no: "01",
    icon: Wrench,
    title: "Sign Board Repair",
    body: "Damage is rarely one component. We inspect the whole sign before replacing the most obvious failed part.",
    points: ["LED modules, drivers & wiring", "Acrylic faces and sign panels", "Frames, fascia and mounting hardware"],
    href: "/sign-board-repair",
  },
  {
    no: "02",
    icon: Sparkles,
    title: "Restoration & Makeover",
    body: "Repair fixes a fault. Restoration brings the sign back to a better standard as a complete visual object.",
    points: ["New faces, graphics and refinishing", "Brighter, more even LED illumination", "Wiring correction & weather protection"],
    href: "/sign-restoration",
  },
  {
    no: "03",
    icon: Zap,
    title: "LED Signage & Repair",
    body: "Front-lit, backlit, halo-lit and light boxes — designed, installed and serviced as part of the sign.",
    points: ["Even module spacing and brightness", "Correct driver and power capacity", "LED upgrades for older signs"],
    href: "/led-sign-repair",
  },
  {
    no: "04",
    icon: Factory,
    title: "New Sign Manufacturing",
    body: "In-house fabrication from measurement to dispatch, with quality checked while the sign is being made.",
    points: ["Acrylic, ACP, steel and aluminium", "3D and channel letters", "Large facade and building signs"],
    href: "/signage-fabrication",
  },
  {
    no: "05",
    icon: IdCard,
    title: "Name Plates & Corporate Signs",
    body: "Small in size does not mean small in importance. Standardised formats for multi-branch organisations.",
    points: ["Acrylic, steel, brass and engraved", "Reception, room and building plates", "Pan-India dispatch from one spec"],
    href: "/name-plates",
  },
  {
    no: "06",
    icon: Settings2,
    title: "Installation & Maintenance",
    body: "Installation determines how a finished sign looks on the building — and how it is serviced later.",
    points: ["Access, lifting and site coordination", "Electrical connection and testing", "Preventive plans for multi-site brands"],
    href: "/sign-installation",
  },
];

export function Services() {
  return (
    <section id="services" className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 pt-18 sm:pt-24 pb-10 scroll-mt-20">
      <Reveal className="max-w-2xl mb-10 sm:mb-12">
        <Eyebrow>SERVICES</Eyebrow>
        <h2 className="font-display font-extrabold text-[28px] sm:text-[40px] leading-[1.12] sm:leading-[1.1] tracking-tight text-ink mb-4">
          One team for the whole sign — not one part of it
        </h2>
        <p className="text-base sm:text-lg">
          Material selection, letter depth, LED density, driver capacity, wiring, weather
          exposure, fixing method, brand colour, night visibility and final alignment —
          brought into a single workflow.
        </p>
      </Reveal>
      <RevealGroup className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => {
          const Icon = s.icon;
          return (
            <RevealItem key={s.no}>
              <Link
                href={s.href}
                className="group block h-full rounded-xl border border-line bg-white p-6 sm:p-7 text-muted transition-all duration-300 hover:-translate-y-1 hover:border-amber/60 hover:shadow-[0_20px_40px_-16px_rgba(7,26,45,0.18)]"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-lg bg-navy/[0.04] group-hover:bg-amber/10 flex items-center justify-center text-blue group-hover:text-amber transition-colors">
                    <Icon size={20} strokeWidth={1.75} />
                  </div>
                  <span className="font-mono-label text-xs tracking-[0.12em] text-line group-hover:text-amber/70 transition-colors">
                    {s.no}
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl leading-snug text-ink mb-2.5">
                  {s.title}
                </h3>
                <p className="text-[15px] leading-relaxed mb-4.5">{s.body}</p>
                <div className="flex flex-col gap-1.5 border-t border-line pt-3.5">
                  {s.points.map((p) => (
                    <div key={p} className="flex gap-2.5 items-start text-[15px] text-muted">
                      <span className="w-1.5 h-1.5 mt-2 bg-amber shrink-0 rounded-full" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </Link>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </section>
  );
}
