import React from "react";
import { PageHero } from "../components/page/PageHero";
import { FeatureGrid } from "../components/page/FeatureGrid";
import { ContentBlock } from "../components/page/ContentBlock";
import { ClosingCta } from "../components/page/ClosingCta";

const solutions = [
  "Storefront fascia signs",
  "Illuminated channel letters",
  "Acrylic 3D letters",
  "Backlit brand logos",
  "ACP and panel signage",
  "Window and glass branding",
  "Indoor retail signs",
  "Wayfinding and category signs",
  "Replacement of damaged outlet signage",
  "Repair and maintenance of illuminated signs",
];

export default function RetailSignagePage() {
  return (
    <>
      <PageHero
        eyebrow="RETAIL & RETAIL CHAIN SIGNAGE"
        title="Make every outlet look like it belongs to the same brand"
        lead="Retail signage has to be consistent, visible and practical. For an independent store, the sign creates the storefront identity. For a retail chain, every sign becomes part of a larger brand system."
      />

      <FeatureGrid eyebrow="RETAIL SIGNAGE SERVICES" title="From a single storefront to a multi-outlet rollout" items={solutions} />

      <ContentBlock title="Chain signage requires consistency" tone="white">
        <p>
          A retail chain may have dozens or hundreds of locations with different
          building surfaces, landlord rules and local installation conditions. The
          challenge is to maintain the same brand appearance while adapting the sign
          to each site. SignFix can work from a master specification and produce
          site-specific dimensions and fabrication details.
        </p>
      </ContentBlock>

      <ContentBlock title="Fast replacement of damaged signs">
        <p>
          Retail locations cannot always wait for a complete new project when a sign
          is damaged. A broken letter, cracked face or dead illumination can make an
          otherwise finished outlet look incomplete. A repair-first approach can
          sometimes restore the storefront faster than replacing the entire sign.
        </p>
      </ContentBlock>

      <ContentBlock title="Large retail and mall projects" tone="white">
        <p>
          Retail signage may need to be coordinated with mall management, landlord
          approvals, restricted working hours, access rules and installation windows.
          SignFix can plan the fabrication and site work around those practical
          requirements.
        </p>
      </ContentBlock>

      <ClosingCta text="Share the brand standard, store list or site photos for a multi-location signage discussion." />
    </>
  );
}
