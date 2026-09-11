import React from "react";
import { PageHero } from "../components/page/PageHero";
import { FeatureGrid } from "../components/page/FeatureGrid";
import { ContentBlock } from "../components/page/ContentBlock";
import { ClosingCta } from "../components/page/ClosingCta";

const solutions = [
  "Building fascia signs",
  "Outdoor LED sign boards",
  "Large illuminated letters",
  "ACP signage",
  "Acrylic signs",
  "Pylon and directional signs",
  "Entrance signs",
  "Corporate building signs",
  "Showroom signs",
  "Restaurant and retail storefronts",
];

export default function OutdoorSignagePage() {
  return (
    <>
      <PageHero
        eyebrow="OUTDOOR SIGNAGE"
        title="Outdoor signs have to survive the environment while continuing to represent the brand"
        lead="Outdoor signage is exposed to sunlight, rain, dust, pollution, temperature changes and physical access conditions. The choice of material, finish, illumination, wiring and mounting method therefore matters."
      />

      <FeatureGrid eyebrow="OUTDOOR SIGNAGE SOLUTIONS" title="Built for exposure, not just for looks" items={solutions} />

      <ContentBlock title="Material and illumination considerations" tone="white">
        <p>
          Outdoor signs require materials and components appropriate to their
          location. Acrylic thickness, metal construction, protective finishes, LED
          modules, power supplies, cable routing and mounting details should all be
          considered together.
        </p>
      </ContentBlock>

      <ContentBlock title="Outdoor repair">
        <p>
          If an outdoor sign has failed, simply changing LEDs may not solve the
          underlying problem. Water ingress, damaged seals, exposed wiring or
          deteriorated mounting components can create recurring faults. A proper
          inspection looks at the system around the failed component.
        </p>
      </ContentBlock>

      <ClosingCta text="Send a daylight photo, night photo and approximate sign size." />
    </>
  );
}
