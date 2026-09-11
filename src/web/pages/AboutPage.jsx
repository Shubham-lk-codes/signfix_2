import React from "react";
import { PageHero } from "../components/page/PageHero";
import { FeatureGrid } from "../components/page/FeatureGrid";
import { ContentBlock } from "../components/page/ContentBlock";
import { ClosingCta } from "../components/page/ClosingCta";

const philosophy = [
  "Understand the site before promising the solution.",
  "Repair what can be repaired properly.",
  "Replace components that compromise reliability or appearance.",
  "Build new when a new sign is the smarter investment.",
  "Keep the brand artwork and physical execution aligned.",
  "Treat installation as part of the finished product.",
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="ABOUT SIGNFIX"
        title="A signage team built around skilled workers, practical equipment and a complete view of the sign"
        lead="SignFix is based in Hyderabad, Telangana, and focuses on the practical side of professional signage: making signs work, making them look right and helping businesses maintain a consistent visual presence."
        cta={{ label: "Talk to the SignFix team", href: "/contact" }}
      />

      <ContentBlock title="Our work" tone="white">
        <p>
          Our work spans repair, restoration, LED systems, name plates, 3D lettering,
          commercial sign boards, fabrication, installation and signage support for
          corporate, retail, restaurant and mall environments.
        </p>
      </ContentBlock>

      <ContentBlock title="Our people are part of the product">
        <p>
          A sign is only as good as the people who fabricate, wire, finish and install
          it. SignFix&apos;s in-house staff bring hands-on experience to the
          production process. The objective is to combine design understanding with
          practical fabrication and electrical knowledge so that the final sign is not
          only attractive but serviceable.
        </p>
      </ContentBlock>

      <ContentBlock title="Our equipment supports the craft" tone="white">
        <p>
          We maintain a workshop environment with the tools and machines required for
          key stages of signage production. This gives our team greater control over
          measurements, cutting, assembly, LED installation, wiring, finishing and
          quality checking.
        </p>
      </ContentBlock>

      <FeatureGrid title="Our working philosophy" items={philosophy} />

      <ContentBlock title="Who we work with" tone="white">
        <p>
          Our target customers include corporate offices, commercial buildings, malls,
          restaurant groups, retail chains, showrooms, property managers and
          businesses that need reliable signage support. We can also support
          individual business owners with smaller signage and repair requirements.
        </p>
      </ContentBlock>

      <ClosingCta text="Talk to the SignFix team about your next signage project." cta={{ label: "Get in touch", href: "/contact" }} />
    </>
  );
}
