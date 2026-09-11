export const siteConfig = {
  name: "SignFix",
  tagline: "Repair. Restore. Refresh. Transform.",
  description:
    "SignFix is a Hyderabad, Telangana signage specialist for sign board repair, LED sign repair, restoration, in-house fabrication, name plates and installation — for corporate offices, malls, restaurants, retail chains and showrooms.",
  url: "https://www.signfix.in",
  serviceArea: "Hyderabad, Telangana",
  serviceAreaLong: "Hyderabad · Pan-India supply · Selected international",
  whatsappNumber: "910000000000",
  contactEmail: "admin@signfix.in",
};

export const servicePages = [
  { label: "Sign Board Repair", href: "/sign-board-repair" },
  { label: "Sign Restoration & Makeover", href: "/sign-restoration" },
  { label: "LED Sign Repair", href: "/led-sign-repair" },
  { label: "In-House Signage Fabrication", href: "/signage-fabrication" },
  { label: "Large Sign Boards & Building Signage", href: "/large-sign-boards" },
  { label: "Corporate Signage", href: "/corporate-signage" },
  { label: "Restaurant & Café Signage", href: "/restaurant-signage" },
  { label: "Retail & Retail Chain Signage", href: "/retail-signage" },
  { label: "Mall & Commercial Property Signage", href: "/mall-signage" },
  { label: "Showroom Signage", href: "/showroom-signage" },
  { label: "Name Plates & Corporate Name Signs", href: "/name-plates" },
  { label: "Outdoor Signage", href: "/outdoor-signage" },
  { label: "Indoor Signage & Corporate Branding", href: "/indoor-signage" },
  { label: "3D Letters, Channel Letters & Illuminated Lettering", href: "/3d-letters" },
  { label: "Sign Maintenance & Preventive Care", href: "/sign-maintenance" },
  { label: "Sign Installation & Replacement", href: "/sign-installation" },
  { label: "Pan-India Signage Supply & Project Support", href: "/pan-india-supply" },
];

export const companyPages = [
  { label: "About SignFix", href: "/about" },
  { label: "Projects / Portfolio", href: "/portfolio" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export const primaryNav = [
  { label: "Services", href: "/#services" },
  { label: "LED Repair", href: "/led-sign-repair" },
  { label: "Industries", href: "/#industries" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export const footerServiceLinks = [
  { label: "Sign board repair", href: "/sign-board-repair" },
  { label: "Restoration & makeover", href: "/sign-restoration" },
  { label: "LED sign repair", href: "/led-sign-repair" },
  { label: "3D & channel letters", href: "/3d-letters" },
  { label: "Installation & maintenance", href: "/sign-installation" },
];

export const footerSectorLinks = [
  { label: "Corporate & offices", href: "/corporate-signage" },
  { label: "Restaurants & cafés", href: "/restaurant-signage" },
  { label: "Retail chains", href: "/retail-signage" },
  { label: "Malls & showrooms", href: "/mall-signage" },
  { label: "Large building signage", href: "/large-sign-boards" },
];

export function whatsappHref(message) {
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
