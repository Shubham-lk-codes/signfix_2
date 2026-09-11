import React from "react";
import { PageHero } from "../components/page/PageHero";
import { FeatureGrid } from "../components/page/FeatureGrid";
import { ContentBlock } from "../components/page/ContentBlock";
import { ClosingCta } from "../components/page/ClosingCta";

const considerations = [
  "Viewing distance and letter height",
  "Daytime contrast and nighttime illumination",
  "Building elevation and mounting surface",
  "Wind and environmental exposure",
  "Access for installation and maintenance",
  "Electrical routing and power supply location",
  "Structural support and fixing method",
  "Brand colour and finish accuracy",
  "Visibility from vehicle and pedestrian approaches",
  "Future service access",
];

export default function LargeSignBoardsPage() {
  return (
    <>
      <PageHero
        eyebrow="LARGE SIGN BOARDS & BUILDING SIGNAGE"
        title="Big signs demand more than big dimensions"
        lead="Large commercial signs are often installed where visibility matters most: building facades, corporate campuses, shopping destinations, showrooms, commercial towers and roadside-facing properties. A large sign must be readable at distance, proportionate to the building, structurally appropriate for its location and professionally illuminated when night visibility is required."
        cta={{ label: "Discuss a large sign project", href: "/contact" }}
      />

      <FeatureGrid eyebrow="LARGE SIGN BOARD CONSIDERATIONS" title="What has to be engineered before fabrication starts" items={considerations} />

      <ContentBlock title="Building name signs and corporate identity" tone="white">
        <p>
          A building name sign is often the most visible expression of an
          organisation. Corporate offices, business parks, hotels, hospitals,
          educational institutions and commercial buildings may require large
          illuminated letters, logo structures or facade-mounted signs. SignFix can
          support fabrication and supply based on approved artwork, dimensions and
          site requirements.
        </p>
      </ContentBlock>

      <ContentBlock title="Large illuminated letters">
        <p>
          Large 3D letters can use acrylic faces, metal returns, stainless steel
          finishes, aluminium construction or other project-specific materials.
          Illumination can be front-lit, backlit or a combination depending on the
          brand and desired visual effect.
        </p>
      </ContentBlock>

      <ContentBlock title="Installation is part of the engineering conversation" tone="white">
        <p>
          For large signage, fabrication cannot be separated from installation. The
          sign has to be designed with practical installation in mind: how it will
          reach the building, how it will be lifted, where it will be fixed, how
          cables will be routed and how future maintenance will be performed.
        </p>
      </ContentBlock>

      <ContentBlock title="Project support from Hyderabad">
        <p>
          SignFix is located in Hyderabad, Telangana, with capability to support
          projects beyond the city according to project size, site requirements,
          logistics and installation arrangements. For pan-India work, we can
          coordinate fabrication and supply with site-specific execution
          requirements.
        </p>
      </ContentBlock>

      <ClosingCta text="For large signs, send the building photo, approximate sign size, location and brand artwork." />
    </>
  );
}
