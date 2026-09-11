import React from "react";
import { PageHero } from "../components/page/PageHero";
import { FeatureGrid } from "../components/page/FeatureGrid";
import { ContentBlock } from "../components/page/ContentBlock";
import { Callout } from "../components/page/Callout";
import { ClosingCta } from "../components/page/ClosingCta";

const whatMattersForGoodLed = [
  "Correct LED module or strip selection for the application",
  "Suitable spacing for even illumination",
  "Appropriate power supply and driver capacity",
  "Correct wiring and secure connections",
  "Protection against moisture in outdoor applications",
  "Adequate ventilation and heat considerations",
  "Access for future maintenance",
  "Consistent brightness across the complete sign",
];

export default function LedSignRepairPage() {
  return (
    <>
      <PageHero
        eyebrow="LED SIGN REPAIR & LED SIGNAGE"
        title="The light is part of the sign — designed, installed and serviced as part of it"
        lead="LED technology has changed commercial signage because it provides high visibility with relatively low power consumption, used in front-lit letters, backlit letters, halo illumination, acrylic light boxes and many custom signage formats. But the quality of an LED sign depends on more than simply installing LEDs behind a letter."
        cta={{ label: "Send a night + daylight photo", href: "/#contact" }}
      />

      <FeatureGrid eyebrow="WHAT GOES INTO GOOD LED SIGNAGE" title="Illumination is an engineering decision, not an afterthought" items={whatMattersForGoodLed} />

      <ContentBlock title="Common LED sign problems" tone="white">
        <p>
          Customers often report a sign that is completely dark, partially dark,
          flickering, too dim, brighter on one side, showing visible dots, or switching
          off after operating for a period. These symptoms can have different causes. A
          professional diagnosis should distinguish between failed LED modules, wiring
          faults, power supply problems, poor connections and physical damage.
        </p>
      </ContentBlock>

      <ContentBlock title="Front-lit, backlit and halo-lit signage">
        <p>
          Front-lit letters use LEDs inside the letter to illuminate the visible face.
          Backlit or halo-lit letters place illumination behind the letter to create a
          controlled glow on the wall. Light boxes use a face and internal illumination
          to create a larger illuminated graphic or logo. Each format requires its own
          fabrication and illumination approach.
        </p>
      </ContentBlock>

      <ContentBlock title="LED repair by skilled technicians" tone="white">
        <p>
          Our technicians work with the practical side of illuminated signage: opening
          and accessing letters, tracing wiring, replacing LED modules, checking drivers
          and power supplies, correcting connections and testing the finished
          illumination. The objective is not simply to make individual LEDs light; it is
          to restore consistent illumination across the sign.
        </p>
      </ContentBlock>

      <Callout title="LED upgrade for older signs">
        Older signs can sometimes be upgraded without replacing the entire structure. A
        planned LED conversion can improve brightness consistency and serviceability
        while retaining a usable frame or letter body. The final decision depends on the
        sign&apos;s construction, condition, access and existing electrical system.
      </Callout>

      <ClosingCta text="Send a night-time photo and a daylight photo of your sign for a quick initial assessment." />
    </>
  );
}
