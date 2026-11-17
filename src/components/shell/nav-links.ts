export type NavLink = { label: string; href: string };

/** The four places a visitor goes; the same list feeds the header and the menu. */
export const NAV_LINKS: NavLink[] = [
  { label: "Shop", href: "/#shop" },
  { label: "How to use", href: "/#how-to-use" },
  { label: "Science & History", href: "/science-and-history" },
  { label: "Wholesale", href: "/wholesale" },
];
