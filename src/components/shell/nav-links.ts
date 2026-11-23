export type NavLink = { label: string; href: string };

/** The four places a visitor goes; the same list feeds the header and the menu. */
export const NAV_LINKS: NavLink[] = [
  { label: "Shop", href: "/#shop" },
  { label: "How to use", href: "/#how-to-use" },
  { label: "History & Science", href: "/history-and-science" },
  { label: "Wholesale", href: "/wholesale" },
];
