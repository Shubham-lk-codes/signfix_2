import React, { useEffect, useState } from "react";
import Link from "../ui/Link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, MessageCircle, ArrowUpRight } from "lucide-react";
import { primaryNav, whatsappHref } from "../../lib/site-config";
import { Logo } from "../ui/Logo";
import { CtaButton } from "../ui/CtaButton";
import useRoute from "../../../hooks/useRoute";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { path } = useRoute();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function isActive(href) {
    if (href.startsWith("/#")) return false;
    return path === href;
  }

  return (
    <>
      <header
        className={`block h-auto p-0 sticky top-0 z-50 bg-white/90 backdrop-blur-md transition-shadow duration-300 ${
          scrolled ? "shadow-[0_4px_24px_-8px_rgba(7,26,45,0.12)] border-b border-transparent" : "border-b border-line"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 h-16 sm:h-20 flex items-center gap-4 lg:gap-8 justify-between">
          <Logo />

          <nav className="hidden lg:flex items-center gap-1 font-display font-semibold text-[13px] tracking-[0.02em] uppercase">
            {primaryNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3 py-2 rounded-full transition-colors ${
                    active
                      ? "bg-navy text-white"
                      : "text-ink hover:bg-paper hover:text-blue"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <CtaButton href="/contact" className="hidden sm:inline-flex py-3! px-5! text-xs">
              Get a Quote
            </CtaButton>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-line text-ink hover:border-navy transition-colors"
            >
              <Menu size={19} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-60 bg-navy/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 right-0 bottom-0 z-70 w-[85%] max-w-sm bg-white lg:hidden flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-line">
                <Logo onClick={() => setOpen(false)} />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-line text-ink"
                >
                  <X size={19} />
                </button>
              </div>

              <nav className="flex flex-col px-3 py-4 gap-0.5 overflow-y-auto">
                {primaryNav.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-3.5 rounded-lg font-display font-semibold text-base transition-colors ${
                        active ? "bg-navy text-white" : "text-ink hover:bg-paper"
                      }`}
                    >
                      {item.label}
                      <ArrowUpRight size={16} className={active ? "text-amber" : "text-line"} />
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto p-5 border-t border-line flex flex-col gap-3">
                <a
                  href={whatsappHref("Hi SignFix, I want to send a photo of my sign.")}
                  className="flex items-center justify-center gap-2 rounded-lg border border-line py-3.5 font-display font-semibold text-sm text-ink hover:border-navy transition-colors"
                >
                  <MessageCircle size={17} />
                  WhatsApp us
                </a>
                <CtaButton href="/contact" onClick={() => setOpen(false)} className="w-full">
                  Get a Quote
                </CtaButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
