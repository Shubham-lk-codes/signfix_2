import React from "react";
import { PageHero } from "../components/page/PageHero";
import { FeatureGrid } from "../components/page/FeatureGrid";
import { ContentBlock } from "../components/page/ContentBlock";
import { ClosingCta } from "../components/page/ClosingCta";

const solutions = [
  "Reception logo signs",
  "Acrylic wall logos",
  "Metal and stainless steel letters",
  "Room name plates",
  "Floor directories",
  "Wayfinding systems",
  "Department signs",
  "Meeting-room signs",
  "Safety and facility identification signs",
  "Branded internal display signage",
];

export default function IndoorSignagePage() {
  return (
    <>
      <PageHero
        eyebrow="INDOOR SIGNAGE & CORPORATE BRANDING"
        title="Carry the brand from the building exterior into the customer experience"
        lead="Indoor signage is part of how visitors understand a business after entering the premises. Reception logos, room identification, directories, wayfinding and branded wall signs should feel like part of the same visual system as the exterior signage."
      />

      <FeatureGrid eyebrow="INDOOR SIGNAGE SOLUTIONS" title="One visual system, inside and out" items={solutions} />

      <ContentBlock title="Corporate interiors" tone="white">
        <p>
          For offices and commercial spaces, the best internal signage is clear
          without being cluttered. Material, size, contrast and placement should help
          people find their destination while maintaining the brand&apos;s
          professional appearance.
        </p>
      </ContentBlock>

      <ClosingCta text="Share your floor plan, brand guideline or wall photo for an indoor signage discussion." />
    </>
  );
}
