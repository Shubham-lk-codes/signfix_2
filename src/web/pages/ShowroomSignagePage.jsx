import React from "react";
import { PageHero } from "../components/page/PageHero";
import { FeatureGrid } from "../components/page/FeatureGrid";
import { ContentBlock } from "../components/page/ContentBlock";
import { ClosingCta } from "../components/page/ClosingCta";

const solutions = [
  "Large facade letters",
  "Illuminated brand logos",
  "Front-lit channel letters",
  "Halo-lit letters",
  "ACP fascia and cladding signage",
  "Entrance signs",
  "Reception and indoor logos",
  "Directional signage",
  "Parking and drive-in identification",
  "Repair and restoration of existing showroom signs",
];

export default function ShowroomSignagePage() {
  return (
    <>
      <PageHero
        eyebrow="SHOWROOM SIGNAGE"
        title="A premium showroom deserves signage that looks premium from the road, parking area and entrance"
        lead="Showrooms often use signage as a major architectural feature. Automotive, furniture, electronics, jewellery, lifestyle and other premium retail environments depend on strong exterior branding to establish identity and attract attention."
      />

      <FeatureGrid eyebrow="SHOWROOM SIGNAGE SOLUTIONS" title="Signage as an architectural feature" items={solutions} />

      <ContentBlock title="Premium finish is part of the brand" tone="white">
        <p>
          A showroom can have beautiful interiors and still look weak from outside if
          the sign is poorly illuminated or badly aligned. SignFix pays attention to
          letter edges, finish quality, illumination uniformity, mounting alignment
          and the way the sign reads from common customer approach points.
        </p>
      </ContentBlock>

      <ContentBlock title="Showroom sign maintenance">
        <p>
          Because showroom signage is highly visible, maintenance matters. Dust,
          weather, failed LEDs and damaged acrylic can quickly reduce the visual
          quality of the frontage. Preventive inspection and prompt repairs can help
          maintain the intended appearance.
        </p>
      </ContentBlock>

      <ClosingCta text="Send the showroom front elevation or photograph and we'll discuss the signage requirement." />
    </>
  );
}
