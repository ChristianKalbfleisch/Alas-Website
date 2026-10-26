import clsx from "clsx";

type LogoProps = {
  className?: string;
  /** Accessible name; pass "" when a visible label already names the brand. */
  title?: string;
};

/**
 * The ALAS stacked lockup (ALAS over SALT CO), drawn from the brand's own vector.
 * It takes the current text colour, so set colour with a text class. Size it by
 * width or height; the aspect ratio is locked. Never redraw or restyle the mark.
 */
export function Logo({ className, title = "ALAS Salt Co." }: LogoProps) {
  const style = {
    aspectRatio: "762 / 579.5",
    WebkitMask: "url(/brand/alas-logo.svg) center / contain no-repeat",
    mask: "url(/brand/alas-logo.svg) center / contain no-repeat",
  };
  const classes = clsx("inline-block bg-current", className);
  if (!title) return <span aria-hidden className={classes} style={style} />;
  return (
    <span role="img" aria-label={title} className={classes} style={style} />
  );
}
