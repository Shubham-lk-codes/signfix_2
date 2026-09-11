import React from "react";
import { FeatureGrid } from "../components/page/FeatureGrid";
import { ContentBlock } from "../components/page/ContentBlock";
import { ContactSection } from "../components/sections/ContactSection";
import { Reveal } from "../components/ui/Reveal";

const sendTheseDetails = [
  "Your name and company",
  "Mobile / WhatsApp",
  "Email",
  "Site location",
  "Type of business",
  "Sign type, if known",
  "Approximate sign size",
  "Daylight photograph",
  "Night photograph for illuminated signs",
  "Description of the problem or new requirement",
  "Required quantity for multiple signs",
];

export default function ContactPage() {
  return (
    <>
      <section className="bg-navy text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-14 sm:pt-18 pb-10 sm:pb-12">
          <Reveal>
            <div className="font-mono-label text-xs tracking-[0.16em] text-amber mb-4">
              CONTACT / REQUEST A QUOTE
            </div>
            <h1 className="font-display font-extrabold text-[30px] sm:text-[44px] leading-[1.12] sm:leading-[1.08] tracking-tight mb-5 text-balance">
              The fastest way to start is to show us the sign
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-cloud max-w-2xl">
              You do not need to know technical signage terminology before contacting
              SignFix. A clear photograph and a simple explanation are enough to begin
              the discussion.
            </p>
          </Reveal>
        </div>
      </section>

      <FeatureGrid eyebrow="SEND THESE DETAILS" title="What helps us give you an accurate answer" items={sendTheseDetails} />

      <ContentBlock title="For corporate and chain projects" tone="white">
        <p>
          If you are handling signage for several locations, share the number of sites,
          city list, brand guideline, sign types, approximate quantities and required
          dates. This helps the team understand whether the requirement is a single
          repair, a rollout or a recurring support program.
        </p>
      </ContentBlock>

      <ContentBlock title="For large signs">
        <p>
          For large building signage, include the building photograph, approximate
          facade width, proposed sign size, access information and whether illumination
          is required. If drawings or brand artwork are available, attach them.
        </p>
      </ContentBlock>

      <ContactSection />
    </>
  );
}
