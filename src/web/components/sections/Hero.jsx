import React from "react";
import { Sparkles } from "lucide-react";
import { CtaButton } from "../ui/CtaButton";
import { PlaceholderMedia } from "../ui/PlaceholderMedia";
import { Noise } from "../ui/Noise";
import { Reveal } from "../ui/Reveal";

const stats = [
  { value: "In-house", label: "FABRICATION & LED" },
  { value: "Pan-India", label: "SUPPLY & ROLLOUTS" },
  { value: "Repair-first", label: "HONEST ASSESSMENT" },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-navy text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-24 right-[-10%] w-[620px] h-[620px] rounded-full opacity-70 blur-[110px]"
          style={{ background: "radial-gradient(circle, rgba(255,176,0,0.22), transparent 65%)" }}
        />
        <div
          className="absolute bottom-[-30%] left-[-10%] w-[520px] h-[520px] rounded-full opacity-60 blur-[100px]"
          style={{ background: "radial-gradient(circle, rgba(18,59,90,0.55), transparent 65%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 80% 60% at 60% 0%, black 40%, transparent 90%)",
          }}
        />
      </div>
      <Noise opacity={0.045} />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 pt-16 sm:pt-24 pb-16 sm:pb-24 grid gap-12 lg:gap-16 items-center grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Reveal>
            <div className="inline-flex items-center gap-2.5 border border-amber/45 bg-amber/[0.06] text-amber font-mono-label text-[11px] sm:text-xs tracking-[0.14em] px-3.5 py-1.5 rounded-full mb-6 sm:mb-7">
              <Sparkles size={13} />
              REPAIR · RESTORE · REFRESH · TRANSFORM
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="font-display font-extrabold text-[34px] leading-[1.08] sm:text-5xl sm:leading-[1.06] lg:text-[60px] lg:leading-[1.03] tracking-tight mb-5 text-balance">
              Your sign is not just a board. It is your business{" "}
              <span className="relative text-amber">
                from a distance.
                <svg
                  aria-hidden
                  className="absolute -bottom-1.5 left-0 w-full h-2.5 text-amber/40"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                >
                  <path d="M2 9C40 3 160 3 198 9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="text-base sm:text-lg leading-relaxed text-cloud mb-8 max-w-xl">
              SignFix is a Hyderabad, Telangana signage specialist for sign board repair,
              LED sign repair, restoration, in-house fabrication and installation — for
              corporate offices, malls, restaurants, retail chains and showrooms.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="flex flex-wrap gap-3.5 mb-10">
              <CtaButton href="/#contact">Send your sign photo</CtaButton>
              <CtaButton href="/#services" variant="outline-dark">
                See what we repair
              </CtaButton>
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="flex flex-wrap gap-8 sm:gap-9 border-t border-navy-line pt-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="font-display font-extrabold text-xl sm:text-2xl text-white">
                    {s.value}
                  </div>
                  <div className="font-mono-label text-[11px] tracking-[0.1em] text-slate mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.18} className="grid gap-4">
          <PlaceholderMedia
            label="HERO PHOTO — illuminated storefront sign at night"
            className="h-[220px] sm:h-[300px] p-4.5"
          />
          <div className="grid grid-cols-2 gap-4">
            <PlaceholderMedia label="BEFORE — faded fascia" className="h-[130px] sm:h-[150px] p-3.5" />
            <PlaceholderMedia
              label="AFTER — restored + new LEDs"
              highlight
              className="h-[130px] sm:h-[150px] p-3.5"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
