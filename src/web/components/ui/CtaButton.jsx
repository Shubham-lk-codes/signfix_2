import React from "react";
import Link from "./Link";
import { ArrowRight } from "lucide-react";

const variantClasses = {
  primary:
    "bg-amber text-navy shadow-[0_8px_24px_-8px_rgba(255,176,0,0.55)] hover:bg-amber-hover hover:shadow-[0_10px_28px_-6px_rgba(255,176,0,0.65)] hover:-translate-y-0.5",
  "outline-dark":
    "border border-navy-line text-white hover:border-amber hover:text-amber hover:-translate-y-0.5",
  "outline-light":
    "border border-line text-ink hover:border-amber hover:-translate-y-0.5",
  "text-dark":
    "text-blue border-b-2 border-amber pb-1",
};

export function CtaButton({
  href,
  children,
  variant = "primary",
  className = "",
  icon = true,
  onClick,
}) {
  const base =
    variant === "text-dark"
      ? "group inline-flex items-center gap-2 font-display font-bold text-sm tracking-wide uppercase transition-colors"
      : "group inline-flex items-center justify-center gap-2.5 rounded font-display font-extrabold text-sm tracking-wide uppercase px-7 py-4 transition-all duration-200";

  return (
    <Link href={href} onClick={onClick} className={`${base} ${variantClasses[variant]} ${className}`}>
      {children}
      {icon && (
        <ArrowRight
          size={16}
          className="transition-transform duration-200 group-hover:translate-x-1"
        />
      )}
    </Link>
  );
}
