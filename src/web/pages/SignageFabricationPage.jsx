import React from "react";
import { PageHero } from "../components/page/PageHero";
import { FeatureGrid } from "../components/page/FeatureGrid";
import { ContentBlock } from "../components/page/ContentBlock";
import { ClosingCta } from "../components/page/ClosingCta";

const capabilities = [
  "Measurement and job preparation",
  "Letter and panel fabrication",
  "Acrylic and sign-face preparation",
  "Metal and frame fabrication as required by project scope",
  "Cutting and assembly",
  "LED installation and wiring",
  "Painting / finishing coordination",
  "Testing and quality checks",
  "Packing and dispatch preparation",
  "Site installation coordination",
];

export default function SignageFabricationPage() {
  return (
    <>
      <PageHero
        eyebrow="IN-HOUSE SIGNAGE FABRICATION"
        title="Skilled people, proper tools and machines, and control over the work from fabrication to installation"
        lead="Large and premium signage requires practical fabrication knowledge. The difference between an ordinary sign and a professionally finished sign can be seen in letter edges, joints, panel alignment, acrylic forming, surface finish, LED distribution, wiring discipline and the way the completed sign sits on the building."
      />

      <FeatureGrid eyebrow="OUR IN-HOUSE CAPABILITIES" title="Key stages controlled under one roof" items={capabilities} columns={3} />

      <ContentBlock title="Why in-house capability matters" tone="white">
        <p>
          When a project moves through multiple uncontrolled suppliers, small
          differences can become visible in the final sign. Letter thickness can
          change, finishes can vary, LED placement can become inconsistent, or a
          promised correction can require another production cycle. An in-house team
          can inspect work while it is being made and correct issues earlier.
        </p>
      </ContentBlock>

      <ContentBlock title="Tools and machines are only useful when skilled people use them">
        <p>
          SignFix&apos;s emphasis is therefore not &quot;machines alone&quot;. The
          important combination is equipment + skilled workers + signage experience +
          quality checking. A laser cutter, fabrication tool, drilling equipment,
          electrical testing equipment or finishing setup only produces a good result
          when the operator understands the final signage requirement.
        </p>
      </ContentBlock>

      <ContentBlock title="Built for small signs and big signs" tone="white">
        <p>
          The same discipline applies whether the requirement is a corporate name
          plate, a reception logo, a retail fascia, a restaurant sign or a large
          building-level sign. Larger signs add more complexity around structure,
          lifting, access, electrical load, visibility, wind exposure and installation
          planning, so they require more careful site assessment.
        </p>
      </ContentBlock>

      <ClosingCta text="Share your drawing, brand file or site photo. We can discuss the right fabrication approach." />
    </>
  );
}
