import React from "react";
import { Lightbulb } from "lucide-react";
import { Reveal } from "../ui/Reveal";

export function Callout({ title, children }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 -mt-2 mb-2">
      <Reveal>
        <div className="bg-amber/[0.07] border border-amber/30 border-l-4 border-l-amber rounded-lg p-5 sm:p-6">
          <div className="flex items-center gap-2 font-display font-bold text-base sm:text-lg text-ink mb-1.5">
            <Lightbulb size={18} className="text-amber shrink-0" />
            {title}
          </div>
          <p className="text-[15px] sm:text-base leading-relaxed text-muted">{children}</p>
        </div>
      </Reveal>
    </div>
  );
}
