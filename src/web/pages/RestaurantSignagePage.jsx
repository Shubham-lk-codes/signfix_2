import React from "react";
import { PageHero } from "../components/page/PageHero";
import { FeatureGrid } from "../components/page/FeatureGrid";
import { ContentBlock } from "../components/page/ContentBlock";
import { ClosingCta } from "../components/page/ClosingCta";

const solutions = [
  "Illuminated restaurant name signs",
  "3D acrylic letters",
  "Front-lit channel letters",
  "Backlit / halo-lit letters",
  "LED light boxes",
  "Fascia signs",
  "Logo signs",
  "Outdoor and entrance signage",
  "Indoor wall logos",
  "Directional and wayfinding signs",
];

export default function RestaurantSignagePage() {
  return (
    <>
      <PageHero
        eyebrow="RESTAURANT & CAFÉ SIGNAGE"
        title="A restaurant sign has to attract attention in seconds — and look good after dark"
        lead="Restaurants compete visually before customers ever see the menu. A strong storefront sign needs to be readable, correctly illuminated and visually aligned with the personality of the restaurant. SignFix creates, repairs and restores restaurant signage ranging from compact storefront signs to large illuminated building signs."
      />

      <FeatureGrid eyebrow="RESTAURANT SIGNAGE SOLUTIONS" title="From a small café facade to a full storefront rebuild" items={solutions} />

      <ContentBlock title="Day and night visibility" tone="white">
        <p>
          A restaurant sign must work in changing light. Daytime visibility depends on
          contrast, material and surface finish. At night, illumination becomes the
          dominant feature. Poor LED distribution can make letters appear patchy,
          while excessive brightness can reduce readability. SignFix focuses on
          balanced illumination and clear brand presentation.
        </p>
      </ContentBlock>

      <ContentBlock title="Repairs for operating restaurants">
        <p>
          A dark restaurant sign can be especially damaging during evening hours. Our
          repair service can address failed LEDs, power supply issues, wiring
          problems, damaged acrylic and other common signage faults. Where the sign is
          old, we can also evaluate whether an LED upgrade or partial restoration
          makes sense.
        </p>
      </ContentBlock>

      <ContentBlock title="Multi-outlet restaurant chains" tone="white">
        <p>
          For restaurants with multiple locations, consistent signage is part of brand
          consistency. SignFix can support repeat fabrication, replacement and repair
          requirements with a common specification so that the storefront experience
          remains recognisable across locations.
        </p>
      </ContentBlock>

      <ClosingCta text="Send your restaurant front photo and sign dimensions. We'll help you plan the right sign." />
    </>
  );
}
