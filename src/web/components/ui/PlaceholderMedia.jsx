import React from "react";

export function PlaceholderMedia({
  label,
  src,
  tone = "dark",
  highlight = false,
  className = "",
}) {
  let imageSrc = src;
  const l = label.toLowerCase();
  
  if (!imageSrc) {
    if (l.includes("hero photo") || l.includes("storefront")) {
      imageSrc = "/images/hero-storefront.svg";
    } else if (l.includes("before")) {
      imageSrc = "/images/hero-before.svg";
    } else if (l.includes("after")) {
      imageSrc = "/images/hero-after.svg";
    } else if (l.includes("workshop") || l.includes("letter fabrication")) {
      imageSrc = "/images/fabrication-workshop.svg";
    } else if (l.includes("wiring")) {
      imageSrc = "/images/fabrication-wiring.svg";
    } else if (l.includes("led repair") || l.includes("channel letter opened")) {
      imageSrc = "/images/led-repair.svg";
    } else if (l.includes("led sign repair") || (l.includes("project") && l.includes("dark"))) {
      imageSrc = "/images/work-led-repair.svg";
    } else if (l.includes("full restoration") || l.includes("aged sign")) {
      imageSrc = "/images/work-restoration.svg";
    } else if (l.includes("rollout") || l.includes("multi-location")) {
      imageSrc = "/images/work-multi-location.svg";
    } else if (l.includes("outdoor")) {
      imageSrc = "/images/service-outdoor.svg";
    } else if (l.includes("indoor") || l.includes("reception")) {
      imageSrc = "/images/service-indoor.svg";
    } else if (l.includes("3d")) {
      imageSrc = "/images/service-3d-letters.svg";
    } else if (l.includes("plate") || l.includes("name")) {
      imageSrc = "/images/service-nameplates.svg";
    } else if (l.includes("install")) {
      imageSrc = "/images/service-installation.svg";
    } else if (l.includes("maintenance")) {
      imageSrc = "/images/service-maintenance.svg";
    }
  }

  const border = highlight
    ? "border-amber shadow-[0_0_20px_rgba(255,176,0,0.3)]"
    : tone === "dark"
    ? "border-navy-line"
    : "border-line";

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border ${border} ${
        tone === "dark" ? "bg-navy-soft" : "bg-slate-100"
      } ${className}`}
    >
      {imageSrc ? (
        <div className="relative w-full h-full min-h-[160px] overflow-hidden">
          <img
            src={imageSrc}
            alt={label}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
            <span className="font-mono-label text-[10px] sm:text-[11px] tracking-wider uppercase px-2.5 py-1 rounded bg-navy/80 backdrop-blur-md text-amber border border-amber/30">
              {label}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-end h-full p-3.5">
          <span
            className={`font-mono-label text-[11px] tracking-wide ${
              tone === "dark" ? "text-slate" : "text-muted"
            }`}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  );
}
