import React from "react";
import { Hero } from "../components/sections/Hero";
import { TrustBar } from "../components/sections/TrustBar";
import { Services } from "../components/sections/Services";
import { LedBanner } from "../components/sections/LedBanner";
import { Industries } from "../components/sections/Industries";
import { Process } from "../components/sections/Process";
import { Fabrication } from "../components/sections/Fabrication";
import { Work } from "../components/sections/Work";
import { Faq } from "../components/sections/Faq";
import { ContactSection } from "../components/sections/ContactSection";
import { ContentBlock } from "../components/page/ContentBlock";

export default function HomePage() {
  return (
    <>
      <Hero />

      <ContentBlock title="Before the customer even walks in" tone="white">
        <p>
          Before a customer enters a restaurant, before a visitor reaches a
          corporate reception, before a shopper walks into a retail store and
          before a guest recognises a showroom, the sign has already communicated
          something about the business. If the sign is dark, damaged, faded,
          unevenly illuminated or poorly finished, the impression can suffer.
        </p>
      </ContentBlock>

      <TrustBar />
      <Services />

      <ContentBlock title="Repair. Restore. Refresh. Transform.">
        <p>
          Our approach is simple: inspect the complete sign, identify the real
          issue, preserve what is worth keeping, replace what has failed and
          upgrade what can improve the result. A broken LED may be the immediate
          problem, but the finished job still has to look like a professional
          sign.
        </p>
      </ContentBlock>

      <LedBanner />
      <Industries />

      <ContentBlock title="Why customers need more than a sign vendor" tone="white">
        <p>
          A serious signage project involves more than printing a logo. It can
          involve material selection, letter depth, acrylic or metal
          construction, LED density, driver capacity, wiring, heat management,
          weather exposure, fixing methods, access equipment, brand colours,
          night visibility and final alignment. SignFix brings these
          considerations into one workflow so the customer does not have to
          coordinate separate technicians for every part of the job.
        </p>
      </ContentBlock>

      <Process />
      <Fabrication />
      <Work />
      <Faq />

      <ContentBlock title="Send us the sign before you decide what to do">
        <p>
          If you already have a sign, send clear photographs from the front and
          side, the location, approximate dimensions and a short description of
          the problem. We can then determine whether the right route is repair,
          restoration, LED replacement, partial rebuild or a completely new sign.
        </p>
      </ContentBlock>

      <ContactSection />
    </>
  );
}
