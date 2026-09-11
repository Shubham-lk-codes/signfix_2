import React, { useState } from "react";
import { MapPin, Globe2, Camera, Mail } from "lucide-react";
import { Eyebrow } from "../ui/Eyebrow";
import { Reveal } from "../ui/Reveal";
import { siteConfig, whatsappHref } from "../../lib/site-config";

const needOptions = [
  "LED sign repair",
  "Restoration",
  "New sign board",
  "Name plates",
  "Multi-location",
];

export function ContactSection() {
  const [need, setNeed] = useState(needOptions[0]);
  const [form, setForm] = useState({
    name: "",
    company: "",
    mobile: "",
    location: "",
    description: "",
  });

  function update(field) {
    return (e) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const lines = [
      `Hi SignFix, I'd like a site inspection.`,
      form.name && `Name: ${form.name}`,
      form.company && `Company: ${form.company}`,
      form.mobile && `Mobile: ${form.mobile}`,
      form.location && `Location: ${form.location}`,
      `Need: ${need}`,
      form.description && `Details: ${form.description}`,
      `(Photos to follow in this chat.)`,
    ].filter(Boolean);
    window.open(whatsappHref(lines.join("\n")), "_blank", "noopener,noreferrer");
  }

  return (
    <section id="contact" className="bg-blue text-white scroll-mt-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-18 sm:py-24 grid gap-12 lg:gap-16 grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <Eyebrow>23 — REQUEST A QUOTE</Eyebrow>
          <h2 className="font-display font-extrabold text-[28px] sm:text-[44px] leading-[1.12] sm:leading-[1.05] tracking-tight text-white mb-4.5 text-balance">
            Your sign is already telling people something about your business.
          </h2>
          <p className="text-base sm:text-lg text-[#dce5ec] mb-8">
            Make sure it is saying the right thing. The fastest way to start is to show
            us the sign.
          </p>
          <div className="flex flex-col gap-4 border-t border-blue-line pt-6.5">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-amber mt-0.5 shrink-0" />
              <div>
                <div className="font-mono-label text-[11px] tracking-[0.12em] text-[#9db6c9]">
                  WORKSHOP
                </div>
                <div className="font-display font-semibold text-lg text-white mt-1">
                  {siteConfig.serviceArea}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe2 size={18} className="text-amber mt-0.5 shrink-0" />
              <div>
                <div className="font-mono-label text-[11px] tracking-[0.12em] text-[#9db6c9]">
                  SERVICE AREA
                </div>
                <div className="font-display font-semibold text-lg text-white mt-1">
                  {siteConfig.serviceAreaLong}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={18} className="text-amber mt-0.5 shrink-0" />
              <div>
                <div className="font-mono-label text-[11px] tracking-[0.12em] text-[#9db6c9]">
                  EMAIL
                </div>
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="font-display font-semibold text-lg text-white mt-1 hover:text-amber transition-colors inline-block"
                >
                  {siteConfig.contactEmail}
                </a>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 text-ink shadow-[0_30px_60px_-24px_rgba(7,26,45,0.35)]">
            <h3 className="font-display font-extrabold text-xl sm:text-[22px] mb-1.5">
              Tell us about the sign
            </h3>
            <p className="text-[15px] text-muted mb-6">
              Short form first — add detail if you have it.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Field label="NAME">
                <input
                  value={form.name}
                  onChange={update("name")}
                  placeholder="Your name"
                  className={inputClass}
                />
              </Field>
              <Field label="COMPANY">
                <input
                  value={form.company}
                  onChange={update("company")}
                  placeholder="Business name"
                  className={inputClass}
                />
              </Field>
              <Field label="MOBILE / WHATSAPP">
                <input
                  value={form.mobile}
                  onChange={update("mobile")}
                  placeholder="+91"
                  className={inputClass}
                />
              </Field>
              <Field label="SITE LOCATION">
                <input
                  value={form.location}
                  onChange={update("location")}
                  placeholder="City / area"
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="mt-3.5 flex flex-col gap-1.5">
              <label className="font-mono-label text-[11px] tracking-[0.1em] text-muted">
                WHAT DO YOU NEED?
              </label>
              <div className="flex flex-wrap gap-2">
                {needOptions.map((label) => {
                  const active = need === label;
                  return (
                    <button
                      type="button"
                      key={label}
                      onClick={() => setNeed(label)}
                      className={`rounded-full px-4 py-2 text-sm font-display font-semibold border transition-colors ${
                        active
                          ? "bg-amber border-amber text-navy"
                          : "bg-paper border-line text-muted hover:border-amber"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3.5 flex flex-col gap-1.5">
              <label className="font-mono-label text-[11px] tracking-[0.1em] text-muted">
                DESCRIBE THE PROBLEM
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={update("description")}
                placeholder="e.g. Half the letters are dark after rain, sign is about 12ft wide"
                className={`${inputClass} resize-y`}
              />
            </div>

            <div className="mt-3.5 border border-dashed border-[#c9d3db] rounded-lg p-4.5 text-center bg-paper">
              <Camera size={18} className="text-muted mx-auto mb-1.5" />
              <div className="font-display font-bold text-[15px] text-ink">
                Attach daylight + night photos on WhatsApp
              </div>
              <div className="font-mono-label text-[11px] text-muted mt-1.5">
                We&apos;ll open a WhatsApp chat pre-filled with these details
              </div>
            </div>

            <button
              type="submit"
              className="mt-5 w-full bg-amber hover:bg-amber-hover text-navy font-display font-extrabold text-base tracking-[0.04em] uppercase py-4 rounded-lg transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              Request a site inspection
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

const inputClass =
  "bg-paper border border-line rounded px-3.5 py-3 font-body text-base text-ink outline-none w-full min-w-0 focus:border-amber";

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="font-mono-label text-[11px] tracking-[0.1em] text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
