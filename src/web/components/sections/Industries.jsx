import React from "react";
import Link from "../ui/Link";
import { Building2, UtensilsCrossed, Store, ShoppingBag, Gem, Landmark } from "lucide-react";
import { Eyebrow } from "../ui/Eyebrow";
import { CtaButton } from "../ui/CtaButton";
import { Reveal, RevealGroup, RevealItem } from "../ui/Reveal";

const industries = [
  {
    icon: Building2,
    title: "Corporate & Offices",
    body: "Building identification, reception logos, corporate name plates, illuminated letters, directional signs and branded environments.",
    href: "/corporate-signage",
  },
  {
    icon: UtensilsCrossed,
    title: "Restaurants & Cafés",
    body: "Storefront signs, illuminated logos, 3D letters, fascia signage, menu-area branding and high-visibility night signage.",
    href: "/restaurant-signage",
  },
  {
    icon: Store,
    title: "Retail Chains",
    body: "Storefront fascia, channel letters, acrylic signs, brand-standard signage, replacement signs and multi-location support.",
    href: "/retail-signage",
  },
  {
    icon: ShoppingBag,
    title: "Malls",
    body: "Retail outlet signage, illuminated letters, fascia repairs, replacement components and signage work coordinated around operating schedules.",
    href: "/mall-signage",
  },
  {
    icon: Gem,
    title: "Showrooms",
    body: "Premium entrance signs, building signs, 3D letters, logo signs and branded customer-facing areas.",
    href: "/showroom-signage",
  },
  {
    icon: Landmark,
    title: "Large Commercial Signs",
    body: "High-visibility building signs, large illuminated letters, facade signage, name signs and custom fabricated structures.",
    href: "/large-sign-boards",
  },
];

export function Industries() {
  return (
    <section id="industries" className="bg-white border-y border-line scroll-mt-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-18 sm:py-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-5 mb-10">
          <div className="max-w-xl">
            <Eyebrow>INDUSTRIES</Eyebrow>
            <h2 className="font-display font-extrabold text-[28px] sm:text-[40px] leading-[1.12] sm:leading-[1.1] tracking-tight text-ink">
              Signage for businesses that care about presentation
            </h2>
          </div>
          <CtaButton href="/#contact" variant="text-dark">
            Discuss your sector
          </CtaButton>
        </Reveal>
        <RevealGroup className="grid gap-4 sm:gap-4.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((i) => {
            const Icon = i.icon;
            return (
              <RevealItem key={i.title}>
                <Link
                  href={i.href}
                  className="group block h-full rounded-xl overflow-hidden bg-white border border-line hover:border-blue hover:shadow-[0_16px_32px_-18px_rgba(7,26,45,0.2)] transition-all duration-300 p-6"
                >
                  <div className="w-11 h-11 rounded-lg bg-blue/6 group-hover:bg-blue/10 flex items-center justify-center text-blue mb-5 transition-colors">
                    <Icon size={20} strokeWidth={1.75} />
                  </div>
                  <h3 className="font-display font-bold text-lg text-ink mb-2">{i.title}</h3>
                  <p className="text-[15px] leading-relaxed">{i.body}</p>
                </Link>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
