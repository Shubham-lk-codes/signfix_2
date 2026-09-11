import React from "react";
import { PageHero } from "../components/page/PageHero";
import { FeatureGrid } from "../components/page/FeatureGrid";
import { ContentBlock } from "../components/page/ContentBlock";
import { ClosingCta } from "../components/page/ClosingCta";

const solutions = [
  "Building name plates and logo signs",
  "Corporate entrance signage",
  "Illuminated 3D letters",
  "Reception and lobby logo signs",
  "Acrylic and metal name plates",
  "Department and room identification",
  "Wayfinding and directional signage",
  "Floor directories",
  "Parking and visitor signage",
  "Branding elements for corporate interiors",
];

export default function CorporateSignagePage() {
  return (
    <>
      <PageHero
        eyebrow="CORPORATE SIGNAGE"
        title="Professional corporate signage for offices, campuses and reception areas"
        lead="Corporate signage has a different responsibility from ordinary shop signage. It has to communicate identity, professionalism and consistency. A reception logo, building name, floor directory, wayfinding sign or illuminated corporate letter can become part of the customer's perception of the company."
        cta={{ label: "Discuss your requirement", href: "/#contact" }}
      />

      <FeatureGrid eyebrow="CORPORATE SIGNAGE SOLUTIONS" title="Everything a corporate identity needs, in one workflow" items={solutions} />

      <ContentBlock title="Designed around brand standards" tone="white">
        <p>
          Corporate signage often needs exact logo proportions, approved colours,
          specified fonts and consistent finishes. SignFix can work from brand
          guidelines, approved artwork or site-specific drawings and translate those
          requirements into practical signage.
        </p>
      </ContentBlock>

      <ContentBlock title="Corporate name plates across India">
        <p>
          For organisations with offices in different cities, consistent name plates can
          become a logistical challenge. SignFix can support production and supply
          requirements for corporate name plates across India, with packaging and
          dispatch planned for the destination. Where international supply is required,
          feasibility depends on dimensions, material, shipping and destination
          requirements.
        </p>
      </ContentBlock>

      <ContentBlock title="Minimal disruption matters" tone="white">
        <p>
          Office signage work often has to happen around business hours, security
          procedures, building access and facility-management requirements. Our project
          planning takes these practical constraints into account so the signage work
          fits the operating environment.
        </p>
      </ContentBlock>

      <ClosingCta text="Send your corporate brand guideline, sign size and site photo to discuss the requirement." />
    </>
  );
}
