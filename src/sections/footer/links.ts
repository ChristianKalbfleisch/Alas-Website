import { products } from "@/data/products";

export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
  note?: string;
};

const salt = products.filter((p) => p.kind === "salt");
const sticks = products.filter((p) => p.kind === "sticks");
const boxes = products.filter((p) => p.kind === "box");

export const SHOP_LINKS: FooterLink[] = [
  ...salt.map((p) => ({ label: p.name, href: `/products/${p.handle}` })),
  ...boxes.map((p) => ({ label: p.name, href: `/products/${p.handle}` })),
  { label: "The Ritual", href: "/#club", note: "Waitlist" },
];

/** Hydration Sticks are one line with a link per pack size. */
export const STICK_LINKS = sticks.map((p) => ({
  label: String(p.sticks ?? ""),
  href: `/products/${p.handle}`,
  aria: `Hydration Sticks, ${p.subtitle}`,
}));

export const STORY_LINKS: FooterLink[] = [
  { label: "Myth and history", href: "/#myth" },
  { label: "Where it comes from", href: "/#origin" },
  { label: "How to use", href: "/#howto" },
  { label: "Rituals", href: "/#rituals" },
];

export const SUPPORT_LINKS: FooterLink[] = [
  { label: "Your grains", href: "/account", note: "Points" },
  { label: "Questions", href: "/#faq" },
  { label: "admin@alassaltco.com", href: "mailto:admin@alassaltco.com" },
  {
    label: "Instagram",
    href: "https://instagram.com/alassaltco",
    external: true,
    note: "@alassaltco",
  },
];

export const FDA_DISCLAIMER =
  "These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.";
