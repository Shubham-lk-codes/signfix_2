import React from "react";
import { PageHero } from "../components/page/PageHero";
import { FeatureGrid } from "../components/page/FeatureGrid";
import { ContentBlock } from "../components/page/ContentBlock";
import { ClosingCta } from "../components/page/ClosingCta";

const support = [
  "Retail outlet fascia signs",
  "Illuminated 3D letters",
  "Logo and brand signs",
  "Storefront repair and restoration",
  "Common-area directional signage",
  "Wayfinding and identification signs",
  "Replacement of damaged letters",
  "LED repair and illumination upgrades",
  "Temporary and replacement signage as required by project scope",
];

export default function MallSignagePage() {
  return (
    <>
      <PageHero
        eyebrow="MALL & COMMERCIAL PROPERTY SIGNAGE"
        title="Professional signage execution for high-traffic commercial environments"
        lead="Mall signage has its own operating realities. Installation may need to happen after closing, during restricted access windows or according to mall engineering and safety procedures. Sign dimensions, mounting systems, electrical connections and appearance may all need approval."
      />

      <FeatureGrid eyebrow="MALL SIGNAGE WE CAN SUPPORT" title="Planned around the property's operating conditions" items={support} />

      <ContentBlock title="Working around mall requirements" tone="white">
        <p>
          A good signage partner understands that the sign is only one part of the
          project. The team may need drawings, measurements, access permissions,
          installation schedules, electrical coordination and final inspection.
          SignFix plans the signage work around the site&apos;s operating conditions.
        </p>
      </ContentBlock>

      <ContentBlock title="Brand visibility without visual compromise">
        <p>
          A mall sign should be noticeable but professionally finished. Letter depth,
          material, illumination, spacing and alignment all influence how a storefront
          appears from the corridor or atrium. Our focus is on a clean finished
          appearance that respects the approved brand design.
        </p>
      </ContentBlock>

      <ContentBlock title="Repair support for retail outlets" tone="white">
        <p>
          For mall tenants, a failed illuminated sign can immediately affect
          storefront visibility. SignFix can inspect the fault and recommend repair,
          LED replacement, face replacement or partial rebuild depending on the
          condition.
        </p>
      </ContentBlock>

      <ClosingCta text="Send the mall location, shop number, sign photo and approximate dimensions." />
    </>
  );
}
