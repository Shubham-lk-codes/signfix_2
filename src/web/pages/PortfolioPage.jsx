import React from "react";
import { PageHero } from "../components/page/PageHero";
import { FeatureGrid } from "../components/page/FeatureGrid";
import { ContentBlock } from "../components/page/ContentBlock";
import { ClosingCta } from "../components/page/ClosingCta";

const caseStudyStructure = [
  "Project title and business type",
  "Location",
  "Before photograph",
  "Initial problem",
  "Site inspection observations",
  "Recommended solution",
  "Fabrication / repair work",
  "LED and electrical work where applicable",
  "Installation photographs",
  "After photograph",
  "Final result",
  "Client objective achieved",
];

const categories = [
  "LED sign repair",
  "Complete sign restoration",
  "Retail storefront transformation",
  "Restaurant signage",
  "Corporate office signage",
  "Mall outlet signage",
  "Large building letters",
  "Name plate projects",
  "3D illuminated letters",
  "New sign board manufacturing",
  "Multi-location signage rollout",
];

export default function PortfolioPage() {
  return (
    <>
      <PageHero
        eyebrow="PROJECTS / PORTFOLIO"
        title="Show the problem, the process and the transformation"
        lead="A strong signage portfolio should not only show beautiful finished photographs. It should demonstrate technical competence. Each project should answer: what was wrong, what the customer needed, what SignFix changed, what materials or LED system were used and what the finished sign looked like after installation."
      />

      <FeatureGrid eyebrow="RECOMMENDED CASE-STUDY STRUCTURE" title="What every case study we publish will answer" items={caseStudyStructure} />

      <ContentBlock title="Portfolio categories" tone="white">
        <p>{categories.join(" · ")}</p>
        <p>
          This structure also creates useful search content because each project can
          naturally include the service type, city, industry, sign format and work
          completed without forcing repetitive keywords.
        </p>
      </ContentBlock>

      <ContentBlock title="Have a project we should document?">
        <p>
          SignFix haven&apos;t published real project case studies yet — this page will
          fill in as jobs are documented, rather than show invented before/after
          stories. If you&apos;ve had signage work done by SignFix and are open to it
          being shared as a case study — with photos and your permission — let us know
          when you send your details.
        </p>
      </ContentBlock>

      <ClosingCta text="Have a signage project? Let's create the next case study together." cta={{ label: "Start a project", href: "/contact" }} />
    </>
  );
}
