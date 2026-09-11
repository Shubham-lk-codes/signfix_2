import React from "react";
import { PageHero } from "../components/page/PageHero";
import { FeatureGrid } from "../components/page/FeatureGrid";
import { ContentBlock } from "../components/page/ContentBlock";
import { ClosingCta } from "../components/page/ClosingCta";

const illuminationOptions = [
  "Front-lit 3D letters",
  "Backlit / halo-lit letters",
  "Combination front-and-back illumination",
  "Acrylic illuminated letters",
  "Stainless steel illuminated letters",
  "Metal channel letters",
  "Non-illuminated premium 3D letters",
];

export default function ThreeDLettersPage() {
  return (
    <>
      <PageHero
        eyebrow="3D LETTERS, CHANNEL LETTERS & ILLUMINATED LETTERING"
        title="Give the brand physical depth — and use light to make it visible after dark"
        lead="Three-dimensional letters can create a premium appearance because the sign has depth, shadow and material presence. They can be manufactured using acrylic, aluminium, stainless steel, metal finishes and other project-specific combinations."
      />

      <FeatureGrid eyebrow="ILLUMINATION OPTIONS" title="A finish for every brand and every budget" items={illuminationOptions} columns={3} />

      <ContentBlock title="Letter construction matters" tone="white">
        <p>
          A good 3D letter is not only about its face material. Return depth, joints,
          internal LED placement, rear fixing, wiring access and final alignment all
          affect the finished appearance. On large signs, these details become even
          more important because small inconsistencies can be visible from a long
          distance.
        </p>
      </ContentBlock>

      <ContentBlock title="Corporate, retail and hospitality applications">
        <p>
          Illuminated 3D letters are suitable for corporate entrances, reception
          areas, restaurants, cafes, retail stores, showrooms, malls and commercial
          buildings. The correct style depends on brand identity, viewing distance,
          available wall area and the desired day/night appearance.
        </p>
      </ContentBlock>

      <ClosingCta text="Send your logo artwork and the wall / facade photo." />
    </>
  );
}
