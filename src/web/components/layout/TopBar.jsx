import React from "react";
import { MessageCircle } from "lucide-react";
import { siteConfig, whatsappHref } from "../../lib/site-config";

export function TopBar() {
  return (
    <div className="bg-navy text-cloud text-xs tracking-[0.04em]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-2 flex items-center justify-between gap-4 font-mono-label">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-[6px] h-[6px] rounded-full bg-amber inline-block shrink-0 animate-[sf-pulse_2.4s_ease-in-out_infinite]" />
          <span className="truncate">{siteConfig.serviceArea.toUpperCase()} — PAN-INDIA SUPPLY</span>
        </div>
        <a
          href={whatsappHref("Hi SignFix, I want to send a photo of my sign.")}
          className="flex items-center gap-1.5 text-cloud hover:text-amber transition-colors shrink-0"
        >
          <MessageCircle size={13} />
          <span className="hidden sm:inline">WhatsApp your sign photo</span>
          <span className="sm:hidden">WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
