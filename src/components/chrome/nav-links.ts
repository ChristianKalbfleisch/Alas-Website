/** Nav destinations. `sections` are the page chapters each link stands for. */
export type NavLink = {
  id: string;
  label: string;
  href: `#${string}`;
  sections: string[];
  /** Shown inline in the desktop capsule (Shop has its own solid button). */
  inline: boolean;
};

export const NAV_LINKS: NavLink[] = [
  {
    id: "myth",
    label: "Story",
    href: "#myth",
    sections: ["alas", "myth"],
    inline: true,
  },
  {
    id: "origin",
    label: "Origin",
    href: "#origin",
    sections: ["origin"],
    inline: true,
  },
  {
    id: "rituals",
    label: "Rituals",
    href: "#rituals",
    sections: ["howto", "rituals"],
    inline: true,
  },
  {
    id: "shop",
    label: "Shop",
    href: "#shop",
    sections: ["meet", "shop", "club"],
    inline: false,
  },
];

export function linkForSection(section: string | null): string | null {
  if (!section) return null;
  return NAV_LINKS.find((l) => l.sections.includes(section))?.id ?? null;
}
