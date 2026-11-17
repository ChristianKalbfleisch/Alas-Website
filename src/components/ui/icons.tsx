import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 24, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export const ArrowRight = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </Base>
);

export const Check = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.5 12.5l5 5 10-11" />
  </Base>
);

export const Close = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 5l14 14M19 5L5 19" />
  </Base>
);

export const Menu = (p: IconProps) => (
  <Base {...p}>
    <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />
  </Base>
);

export const Plus = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const Minus = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 12h14" />
  </Base>
);

export const Bag = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 8h14l-1 12H6L5 8z" />
    <path d="M9 8V6.5a3 3 0 016 0V8" />
  </Base>
);

export const Truck = (p: IconProps) => (
  <Base {...p}>
    <path d="M2.5 6.5h11v10h-11zM13.5 9.5h4l3 3.5v3.5h-7" />
    <circle cx="7" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
  </Base>
);

export const Shield = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3l7.5 2.8v5.4c0 4.6-3 8.2-7.5 9.8-4.5-1.6-7.5-5.2-7.5-9.8V5.8L12 3z" />
    <path d="M8.5 12l2.5 2.5 4.5-5" />
  </Base>
);

/** The three drawings from the back of the pack: hand, sun, sea. */
export const Hand = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 15.5c2.2-1.6 4.2-2.3 6-2.1l4.2.6c1 .15 1.5.8 1.4 1.5-.1.75-.8 1.2-1.7 1.1l-3.4-.4" />
    <path d="M14.4 15.9l4.4-2.3c.9-.45 1.8-.2 2.1.5.3.65 0 1.4-.8 1.85l-6.3 3.5c-.9.5-1.9.65-2.9.45l-4.4-.9c-.9-.2-1.8-.05-2.6.4L3 20" />
    <path d="M12.5 6.5l.9 1.6M16 4.5v2M19.5 6.5l-.9 1.6M14.6 10.4h2.8" />
  </Base>
);

export const Sun = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8" />
  </Base>
);

export const Sea = (p: IconProps) => (
  <Base {...p}>
    <path d="M2.5 8c1.6-1.5 3.2-1.5 4.8 0s3.2 1.5 4.7 0 3.2-1.5 4.8 0 3.1 1.5 4.7 0" />
    <path d="M2.5 12.5c1.6-1.5 3.2-1.5 4.8 0s3.2 1.5 4.7 0 3.2-1.5 4.8 0 3.1 1.5 4.7 0" />
    <path d="M2.5 17c1.6-1.5 3.2-1.5 4.8 0s3.2 1.5 4.7 0 3.2-1.5 4.8 0 3.1 1.5 4.7 0" />
  </Base>
);

export const Leaf = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14" />
    <path d="M5 19c2-4.5 5-7.5 9-9.5" />
  </Base>
);

export const Glass = (p: IconProps) => (
  <Base {...p}>
    <path d="M6.5 3.5h11l-1.4 17H7.9L6.5 3.5z" />
    <path d="M7.2 11h9.6" />
  </Base>
);

export const Bottle = (p: IconProps) => (
  <Base {...p}>
    <path d="M10 2.5h4v3l1.8 2.6c.5.7.7 1.5.7 2.3v9.1c0 1.1-.9 2-2 2h-5c-1.1 0-2-.9-2-2v-9.1c0-.8.2-1.6.7-2.3L10 5.5v-3z" />
    <path d="M7.5 13h9" />
  </Base>
);

export const Plate = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
  </Base>
);

export const Chevron = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 9l6 6 6-6" />
  </Base>
);

export const Lock = (p: IconProps) => (
  <Base {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 018 0v3" />
  </Base>
);

export const Gift = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 11h16v9.5H4zM3 7.5h18V11H3zM12 7.5v13" />
    <path d="M12 7.5C10.5 4 7 4 7 6s2.5 1.5 5 1.5zM12 7.5C13.5 4 17 4 17 6s-2.5 1.5-5 1.5z" />
  </Base>
);

export const Tag = (p: IconProps) => (
  <Base {...p}>
    <path d="M3.5 12.2V4.5h7.7l9.3 9.3-7.7 7.7-9.3-9.3z" />
    <circle cx="8" cy="9" r="1.3" />
  </Base>
);
