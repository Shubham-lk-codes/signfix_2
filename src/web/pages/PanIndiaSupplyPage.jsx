import React from "react";
import { PageHero } from "../components/page/PageHero";
import { FeatureGrid } from "../components/page/FeatureGrid";
import { ContentBlock } from "../components/page/ContentBlock";
import { ClosingCta } from "../components/page/ClosingCta";

const coordinated = [
  "Centralised fabrication",
  "Corporate name plates",
  "Retail outlet signage",
  "Replacement letters and components",
  "LED sign components",
  "Standardised signage based on approved artwork",
  "Packing and dispatch",
  "Site-specific fabrication where dimensions differ",
  "Installation coordination subject to project scope",
];

export default function PanIndiaSupplyPage() {
  return (
    <>
      <PageHero
        eyebrow="PAN-INDIA SIGNAGE SUPPLY & PROJECT SUPPORT"
        title="One signage partner from Hyderabad for projects that need supply beyond one city"
        lead="Signage projects increasingly cross city boundaries. A retail chain may open in several states, a corporate group may require name plates for offices across India, or a brand may need identical signs manufactured centrally and delivered to different locations."
      />

      <FeatureGrid eyebrow="WHAT CAN BE COORDINATED" title="One specification, delivered to many locations" items={coordinated} />

      <ContentBlock title="Why central coordination helps" tone="white">
        <p>
          Central production can improve consistency when the same logo, colour,
          material and letter style must appear at multiple locations. The key is to
          maintain a clear specification so every location receives the correct
          version.
        </p>
      </ContentBlock>

      <ContentBlock title="From Hyderabad to other locations">
        <p>
          SignFix is based in Hyderabad, Telangana. Projects outside Hyderabad are
          planned according to the product, quantity, dimensions, delivery
          destination, site access and installation requirement. For international
          supply, shipping feasibility and destination-specific logistics are
          considered separately.
        </p>
      </ContentBlock>

      <ClosingCta text="Send the number of locations, sign types, quantities and delivery cities." />
    </>
  );
}
