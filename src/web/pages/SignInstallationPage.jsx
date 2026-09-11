import React from "react";
import { PageHero } from "../components/page/PageHero";
import { FeatureGrid } from "../components/page/FeatureGrid";
import { ContentBlock } from "../components/page/ContentBlock";
import { ClosingCta } from "../components/page/ClosingCta";

const scope = [
  "New sign installation",
  "Replacement of existing signs",
  "LED illuminated sign installation",
  "3D letter fixing",
  "Facade and fascia signage installation",
  "Reception and indoor sign installation",
  "Electrical connection and illumination testing within project scope",
  "Removal of old signage where agreed",
  "Final alignment and handover",
];

export default function SignInstallationPage() {
  return (
    <>
      <PageHero
        eyebrow="SIGN INSTALLATION & REPLACEMENT"
        title="The installation determines how the finished sign looks on the building"
        lead="Even a beautifully fabricated sign can look poor if it is installed without careful measurement and alignment. Installation includes more than fixing the sign to a wall. It may involve access planning, mounting, electrical connection, cable routing, alignment, testing and final cleanup."
      />

      <FeatureGrid eyebrow="INSTALLATION SCOPE" title="From first fix to final handover" items={scope} />

      <ContentBlock title="For large commercial projects" tone="white">
        <p>
          Installation of large signage may require special access equipment, lifting
          arrangements, working-hour restrictions, site permits and coordination with
          building management. These requirements should be assessed before
          fabrication so that the final sign is practical to install.
        </p>
      </ContentBlock>

      <ClosingCta text="Send site photos, access details and sign dimensions for an installation assessment." />
    </>
  );
}
