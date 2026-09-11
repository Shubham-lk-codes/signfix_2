import React, { useState } from "react";
import { Plus } from "lucide-react";
import { RevealGroup, RevealItem } from "../ui/Reveal";

const faqs = [
  {
    q: "Can you repair an existing LED sign board?",
    a: "Yes. SignFix can inspect LED modules, power supplies, wiring, connections, acrylic faces and related components and recommend repair, replacement or an upgrade depending on the condition.",
  },
  {
    q: "Do you repair signs made by another company?",
    a: "Yes. The important factors are the current condition, construction, accessibility and repairability of the sign.",
  },
  {
    q: "Can you make an old sign look new?",
    a: "In many cases, yes. Restoration may include new acrylic, LED replacement, graphics, refinishing, letter repair, cleaning and alignment.",
  },
  {
    q: "How do I know whether I should repair or replace my sign?",
    a: "The decision depends on the structural condition, age, material, electrical system, visual condition and the cost of repeated repairs. SignFix can explain the practical options after inspection.",
  },
  {
    q: "Do you manufacture new LED sign boards?",
    a: "Yes. New illuminated signage can be fabricated according to the approved artwork, size, application and site requirements.",
  },
  {
    q: "Do you make large building signs?",
    a: "Yes. Large signage requires additional planning for structure, access, installation, visibility and electrical requirements. A site assessment is recommended.",
  },
  {
    q: "Can you make corporate name plates?",
    a: "Yes. Name plates can be produced to standardised corporate formats and supplied to multiple locations.",
  },
  {
    q: "Do you supply outside Hyderabad?",
    a: "Yes, project feasibility is assessed based on the product, quantity, destination and installation requirement. SignFix is based in Hyderabad, Telangana.",
  },
  {
    q: "Do you supply internationally?",
    a: "Selected signage and name-plate products can be prepared for international shipment, subject to size, material, packaging, freight and destination requirements.",
  },
  {
    q: "Can you support retail chains?",
    a: "Yes. Centralised specifications, fabrication, replacement signage and multi-location coordination can be planned for retail networks.",
  },
  {
    q: "Can you work with mall outlets?",
    a: "Yes. Mall projects can be planned around approved drawings, access rules, installation windows and property requirements.",
  },
  {
    q: "Can you repair a flickering sign?",
    a: "Flickering may be caused by LEDs, power supplies, wiring or connections. The sign should be diagnosed rather than replacing parts at random.",
  },
  {
    q: "Can you replace only the LED modules?",
    a: "Where the sign construction allows it, LED modules can often be replaced without replacing the complete sign.",
  },
  {
    q: "Do you install the signs you manufacture?",
    a: "Installation can be included according to project location and scope. For larger projects, site access and installation requirements are assessed in advance.",
  },
  {
    q: "What should I send for a quotation?",
    a: "Send a clear front photograph, a side photograph if possible, approximate width and height, location, business type and a short description of the requirement.",
  },
];

export function FaqList() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <RevealGroup className="flex flex-col gap-2.5 max-w-5xl mx-auto px-4 sm:px-8 pb-16 sm:pb-22">
      {faqs.map((f, i) => {
        const open = openIndex === i;
        return (
          <RevealItem key={f.q}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              className="w-full text-left bg-white border border-line hover:border-blue rounded-lg px-5 sm:px-5.5 py-4.5 sm:py-5 transition-colors cursor-pointer"
              aria-expanded={open}
            >
              <div className="flex gap-4 items-start justify-between">
                <h3 className="font-display font-bold text-[15px] sm:text-[17px] text-ink">
                  {f.q}
                </h3>
                <Plus
                  size={18}
                  className={`shrink-0 text-amber mt-0.5 transition-transform duration-300 ${open ? "rotate-45" : ""}`}
                />
              </div>
              <div
                className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] mt-3.5 opacity-100" : "grid-rows-[0fr] opacity-0"}`}
              >
                <p className="overflow-hidden text-[15px] sm:text-base leading-relaxed text-muted">
                  {f.a}
                </p>
              </div>
            </button>
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}
