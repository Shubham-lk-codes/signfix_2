import React from "react";
import { PageHero } from "../components/page/PageHero";
import { FeatureGrid } from "../components/page/FeatureGrid";
import { ContentBlock } from "../components/page/ContentBlock";
import { ClosingCta } from "../components/page/ClosingCta";
import { Reveal, RevealGroup, RevealItem } from "../components/ui/Reveal";
import { Search, ClipboardList, Hammer, PenTool, TestTube2 } from "lucide-react";

const restorationWork = [
  "Complete sign cleaning and preparation",
  "Acrylic face replacement",
  "New LED modules for brighter and more even illumination",
  "Replacement of aging power supplies and drivers",
  "Letter face repair or replacement",
  "Graphic and vinyl replacement",
  "Painting and surface refinishing",
  "Frame repair and selected fabrication work",
  "Wiring correction and weather protection",
  "Re-alignment and final presentation improvement",
];

const approach = [
  { no: "1", icon: Search, title: "Inspect", body: "We examine the sign, mounting, electrical condition, illumination, materials and overall appearance." },
  { no: "2", icon: ClipboardList, title: "Plan", body: "We separate essential repairs from optional upgrades and identify the components worth preserving." },
  { no: "3", icon: Hammer, title: "Rebuild", body: "Failed components are repaired or replaced, and damaged surfaces are restored." },
  { no: "4", icon: PenTool, title: "Refinish", body: "Where required, faces, graphics, letters and finishes are refreshed." },
  { no: "5", icon: TestTube2, title: "Test", body: "Illumination, electrical connections and visual consistency are checked before completion." },
];

export default function SignRestorationPage() {
  return (
    <>
      <PageHero
        eyebrow="SIGN RESTORATION & MAKEOVER"
        title="Turn an old, faded or damaged sign into a cleaner, brighter, more professional statement"
        lead="Sign restoration is different from simple repair. Repair fixes a fault. Restoration looks at the sign as a complete visual object and brings its appearance and function back to a better standard."
      />

      <ContentBlock title="When restoration makes sense" tone="white">
        <p>
          Restoration is ideal when the existing sign has a usable structure but has
          lost its original appearance. The frame may still be strong, the letter design
          may still be correct and the brand identity may still be relevant, but the
          face, LEDs, finish, graphics or electrical system may have deteriorated.
        </p>
      </ContentBlock>

      <FeatureGrid eyebrow="OUR RESTORATION WORK CAN INCLUDE" title="Bringing a sign back to a better standard" items={restorationWork} />

      <section className="bg-white border-y border-line">
        <div className="max-w-4xl mx-auto px-4 sm:px-5 py-12 sm:py-16">
          <Reveal className="mb-8">
            <div className="font-mono-label text-xs tracking-[0.16em] text-amber mb-3">
              THE SIGNFIX TRANSFORMATION APPROACH
            </div>
            <h2 className="font-display font-extrabold text-2xl sm:text-[32px] leading-[1.15] tracking-tight text-ink">
              Inspect. Plan. Rebuild. Refinish. Test.
            </h2>
          </Reveal>
          <RevealGroup className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {approach.map((s) => {
              const Icon = s.icon;
              return (
                <RevealItem key={s.no}>
                  <div className="flex gap-4 bg-paper border border-line rounded-lg p-5 h-full">
                    <Icon size={20} className="text-blue shrink-0 mt-0.5" strokeWidth={1.75} />
                    <div>
                      <h3 className="font-display font-bold text-base text-ink mb-1">
                        {s.no}. {s.title}
                      </h3>
                      <p className="text-[15px] leading-relaxed">{s.body}</p>
                    </div>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      <ContentBlock title="Why restoration can be better than a complete replacement">
        <p>
          A complete replacement can be appropriate, but it is not always necessary. If
          the existing sign has a good structure, restoration may reduce unnecessary
          material waste and preserve a sign format that already fits the site. At the
          same time, restoration gives the business an opportunity to upgrade LEDs,
          improve illumination and refresh the visual finish.
        </p>
      </ContentBlock>

      <ContentBlock title="A new look without losing the brand" tone="white">
        <p>
          For corporate offices, restaurants, retail stores and showrooms, a sign
          makeover should remain faithful to the brand. The objective is not to make the
          sign look different for the sake of being different. The objective is to make
          it look intentional, current, clean and professionally executed.
        </p>
      </ContentBlock>

      <ClosingCta text="Let SignFix assess whether your existing sign can be restored or should be rebuilt." />
    </>
  );
}
