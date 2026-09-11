import React from "react";
import { PageHero } from "../components/page/PageHero";
import { FeatureGrid } from "../components/page/FeatureGrid";
import { ContentBlock } from "../components/page/ContentBlock";
import { Callout } from "../components/page/Callout";
import { ClosingCta } from "../components/page/ClosingCta";

const whatWeRepair = [
  "LED modules and LED strips",
  "Power supplies, drivers and electrical components",
  "Illuminated channel letters",
  "Acrylic faces and sign panels",
  "3D letters and individual letter components",
  "Loose or damaged wiring",
  "Fascia and sign frames",
  "Mounting hardware and selected structural elements",
  "Vinyl graphics and printed faces",
  "Backlit, front-lit and halo-lit signage",
];

export default function SignBoardRepairPage() {
  return (
    <>
      <PageHero
        eyebrow="SIGN BOARD REPAIR"
        title="Professional sign board repair for businesses that cannot afford a poor first impression"
        lead="Sign board damage is rarely limited to one component. A sign may have dead LED modules, a failed power supply, loose wiring, cracked acrylic, damaged letters, water ingress, faded graphics, broken mounting points or an uneven light output. SignFix approaches sign repair as a complete inspection rather than simply replacing the most obvious failed part."
      />

      <FeatureGrid eyebrow="WHAT WE REPAIR" title="Every component that can fail on a sign" items={whatWeRepair} />

      <ContentBlock title="Why a professional repair matters" tone="white">
        <p>
          A sign can be technically working and still look poor. Uneven LED spacing can
          create bright spots and dark patches. Incorrect power supply sizing can cause
          recurring failures. Loose wiring can create intermittent lighting. A damaged
          acrylic face can distort the appearance of the brand. Poorly aligned
          replacement letters can make the sign look improvised.
        </p>
        <p>Our technicians look at the complete visual and technical condition before completing the repair.</p>
      </ContentBlock>

      <Callout title="Repair or replace?">
        The most economical answer is not always the cheapest component. If the frame
        and structure are sound, a repair may be the smartest choice. If several
        components have reached the end of their useful life, a restoration or upgrade
        may produce a better long-term result. If the sign has become structurally
        unsuitable or the brand has changed, replacement may be the better route. We
        explain the options instead of forcing one solution.
      </Callout>

      <ContentBlock title="For corporate and commercial properties">
        <p>
          SignFix supports repair requirements for offices, retail outlets, restaurants,
          malls, showrooms and other customer-facing locations. For businesses
          operating multiple outlets, the same repair logic can be applied across sites
          so that brand presentation remains consistent.
        </p>
      </ContentBlock>

      <ContentBlock title="Local expertise, broader reach" tone="white">
        <p>
          Our base is Hyderabad, Telangana. For projects and supply requirements outside
          Hyderabad, the scope can be planned around fabrication, dispatch, site
          coordination and installation requirements. Name plates and selected signage
          products can be supplied across India and, where logistics and project
          requirements permit, for international destinations.
        </p>
      </ContentBlock>

      <ClosingCta text="Send photos of your damaged sign and tell us what is not working." />
    </>
  );
}
