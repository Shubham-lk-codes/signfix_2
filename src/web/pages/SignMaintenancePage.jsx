import React from "react";
import { PageHero } from "../components/page/PageHero";
import { FeatureGrid } from "../components/page/FeatureGrid";
import { ContentBlock } from "../components/page/ContentBlock";
import { ClosingCta } from "../components/page/ClosingCta";

const checks = [
  "Visual inspection of sign faces and letters",
  "LED illumination checks",
  "Power supply and driver inspection",
  "Wiring and connection checks",
  "Mounting and fixing checks",
  "Acrylic and face condition",
  "Cleaning and presentation",
  "Early identification of failed or aging components",
  "Photo documentation for multi-location customers",
];

export default function SignMaintenancePage() {
  return (
    <>
      <PageHero
        eyebrow="SIGN MAINTENANCE & PREVENTIVE CARE"
        title="Keep the sign working before a customer notices that it is not"
        lead="Sign maintenance is often overlooked because a sign appears to be a passive asset. In reality, illuminated signage contains electrical components, LEDs, power supplies, wiring, mounting systems, faces and finishes that gradually experience wear."
        cta={{ label: "Ask about a maintenance plan", href: "/contact" }}
      />

      <FeatureGrid eyebrow="MAINTENANCE CHECKS CAN INCLUDE" title="A structured inspection, not just a wipe-down" items={checks} />

      <ContentBlock title="For chains and commercial properties" tone="white">
        <p>
          Preventive signage maintenance is especially useful for retail chains,
          restaurants, malls and corporate groups where one small signage failure can
          be repeated across locations. A scheduled inspection approach can identify
          recurring component problems and standardise replacement parts.
        </p>
      </ContentBlock>

      <ContentBlock title="Maintenance is not just cleaning">
        <p>
          Cleaning can improve presentation, but technical maintenance goes further.
          It looks at the components that make the sign operate safely and
          consistently. SignFix can combine visual refurbishment with LED and
          electrical checks where the project requires it.
        </p>
      </ContentBlock>

      <ClosingCta text="Ask about a maintenance plan for one location or multiple sites." cta={{ label: "Ask about a plan", href: "/contact" }} />
    </>
  );
}
