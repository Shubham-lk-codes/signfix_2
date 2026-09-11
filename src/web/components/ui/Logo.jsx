import React from "react";
import Link from "./Link";
import { Wrench } from "lucide-react";

export function Logo({
  variant = "dark",
  onClick,
}) {
  const light = variant === "light";

  return (
    <Link href="/" onClick={onClick} className="group flex items-center gap-2.5 shrink-0">
      <span
        className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg shrink-0 transition-transform group-hover:scale-105 ${
          light ? "bg-amber" : "bg-navy"
        }`}
      >
        <Wrench size={18} strokeWidth={2.25} className={light ? "text-navy" : "text-amber"} />
      </span>
      <span className="leading-tight">
        <span
          className={`block font-display font-extrabold text-lg sm:text-xl tracking-tight ${
            light ? "text-white" : "text-ink"
          }`}
        >
          Sign<span className="text-amber">Fix</span>
        </span>
        <span
          className={`hidden sm:block font-mono-label text-[9px] tracking-[0.18em] mt-0.5 ${
            light ? "text-slate" : "text-muted"
          }`}
        >
          ALL SIGNAGE SOLUTIONS
        </span>
      </span>
    </Link>
  );
}
