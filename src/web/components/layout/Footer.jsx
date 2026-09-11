import React from "react";
import Image from "../ui/Image";
import Link from "../ui/Link";
import { companyPages, footerSectorLinks, footerServiceLinks, siteConfig, whatsappHref } from "../../lib/site-config";

export function Footer() {
  return (
    <footer className="bg-navy text-slate">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 pt-12 sm:pt-16 pb-7 grid gap-9 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <Image
            src="/images/logo.jpeg"
            alt={siteConfig.name}
            height={64}
            width={160}
            className="h-14 sm:h-16 w-auto rounded mb-4"
          />
          <p className="text-[15px] leading-relaxed max-w-[280px]">
            We don&apos;t just repair signs. We transform them.
          </p>
        </div>
        <div>
          <div className="font-display font-bold text-[13px] tracking-[0.1em] uppercase text-white mb-3.5">
            Services
          </div>
          <div className="flex flex-col gap-2.5 text-[15px]">
            {footerServiceLinks.map((item) => (
              <Link key={item.label} href={item.href} className="hover:text-amber transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <div className="font-display font-bold text-[13px] tracking-[0.1em] uppercase text-white mb-3.5">
            Sectors
          </div>
          <div className="flex flex-col gap-2.5 text-[15px]">
            {footerSectorLinks.map((item) => (
              <Link key={item.label} href={item.href} className="hover:text-amber transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <div className="font-display font-bold text-[13px] tracking-[0.1em] uppercase text-white mb-3.5">
            Company
          </div>
          <div className="flex flex-col gap-2.5 text-[15px]">
            {companyPages.map((item) => (
              <Link key={item.label} href={item.href} className="hover:text-amber transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <div className="font-display font-bold text-[13px] tracking-[0.1em] uppercase text-white mb-3.5">
            Contact
          </div>
          <div className="flex flex-col gap-2.5 text-[15px]">
            <Link href="/contact" className="text-amber hover:text-amber-hover transition-colors">
              Request a quote
            </Link>
            <a
              href={whatsappHref("Hi SignFix, I want to send a photo of my sign.")}
              className="hover:text-amber transition-colors"
            >
              WhatsApp us
            </a>
            <a href={`mailto:${siteConfig.contactEmail}`} className="hover:text-amber transition-colors">
              {siteConfig.contactEmail}
            </a>
            <span>{siteConfig.serviceArea}</span>
            <span>Pan-India supply</span>
          </div>
        </div>
      </div>
      <div className="border-t border-navy-line">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-4.5 flex flex-wrap gap-3 justify-between font-mono-label text-xs tracking-[0.06em] text-[#5f7a91]">
          <span>© {siteConfig.name.toUpperCase()} — ALL SIGNAGE SOLUTIONS</span>
          <span>REPAIR · MANUFACTURE · INSTALL</span>
        </div>
      </div>
    </footer>
  );
}
