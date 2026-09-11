import React from "react";
import { PageHero } from "../components/page/PageHero";
import { FeatureGrid } from "../components/page/FeatureGrid";
import { ContentBlock } from "../components/page/ContentBlock";
import { ClosingCta } from "../components/page/ClosingCta";

const formats = [
  "Acrylic name plates",
  "Stainless steel name plates",
  "Brass-finish name plates",
  "Metal engraved plates",
  "Corporate desk and door plates",
  "Room identification plates",
  "Reception name signs",
  "Building name plates",
  "Department and facility signs",
  "Custom branded name boards",
];

export default function NamePlatesPage() {
  return (
    <>
      <PageHero
        eyebrow="NAME PLATES & CORPORATE NAME SIGNS"
        title="Small in size does not mean small in importance"
        lead="Name plates are used in offices, cabins, reception areas, buildings, institutions, residential developments, corporate facilities and commercial spaces. A well-made name plate gives a space identity and makes navigation easier."
      />

      <FeatureGrid eyebrow="NAME PLATE FORMATS" title="A format and finish for every space" items={formats} />

      <ContentBlock title="Supply across India" tone="white">
        <p>
          SignFix can support name plate requirements for customers in different
          Indian cities through controlled production, packaging and dispatch. For
          organisations with multiple branches, standardised artwork and production
          specifications can help keep the same visual identity across locations.
        </p>
      </ContentBlock>

      <ContentBlock title="International supply">
        <p>
          For international requirements, name plates can be prepared for shipment
          subject to product dimensions, material, packaging, destination and freight
          considerations. International supply is planned as a product-and-logistics
          requirement rather than treating every destination as identical.
        </p>
      </ContentBlock>

      <ContentBlock title="Corporate standardisation" tone="white">
        <p>
          A large organisation may need hundreds of room plates or multiple office
          identification signs. In such projects, consistency becomes more important
          than making each plate individually. SignFix can work from a standard
          template and approved brand format to maintain uniformity.
        </p>
      </ContentBlock>

      <ClosingCta text="Send the name, size, material preference, quantity and destination." />
    </>
  );
}
