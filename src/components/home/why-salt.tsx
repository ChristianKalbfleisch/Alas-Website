import Link from "next/link";
import { ArrowRight } from "@/components/ui/icons";
import { numbered } from "@/data/sources";
import { SODIUM_NOTE, WHY_POINTS, WHY_TITLE } from "@/data/why-salt";

const LONG_READ = "/history-and-science";

/** One point: a rule above it, as in the lists further down the page. */
const POINT = "mt-2 border-line border-t pt-2 wide:mt-10 wide:pt-6";

/** The credits under one point, each linked to its entry in the long read's list. */
function Credits({ names }: { names: string[] }) {
  const sources = numbered.filter((source) => names.includes(source.short));
  if (sources.length === 0) return null;
  return (
    // Each link is a full-size tap target; the negative margins keep the row
    // as tall, and the names as close, as plain text.
    <p className="t-small -my-2.5 flex flex-wrap items-center gap-x-4 text-ink-2">
      <span className="sr-only">
        {sources.length > 1 ? "Sources:" : "Source:"}
      </span>
      {sources.map((source) => (
        <Link
          key={source.n}
          href={`${LONG_READ}#source-${source.n}`}
          className="link -mx-2 inline-flex min-h-11 items-center px-2"
        >
          {source.short}
        </Link>
      ))}
    </p>
  );
}

/**
 * Why people salt their water, in brief: two credited facts and how much
 * sodium a serving has, all three set alike, with the way to the long read.
 * Short, and tighter still on a phone, because the shop is next.
 */
export function WhySalt() {
  return (
    <section
      id="why-salt"
      aria-labelledby="why-salt-title"
      className="pt-4 pb-2 wide:py-[clamp(3rem,1.5rem+3vw,4.5rem)]"
    >
      <div className="wrap grid gap-x-8 wide:grid-cols-[1fr_1fr_1.35fr] lg:gap-x-10">
        <h2 id="why-salt-title" className="t-h2 wide:col-span-3">
          {WHY_TITLE}
        </h2>
        {WHY_POINTS.map((point) => (
          <div key={point.line} className={POINT}>
            <p className="t-lead text-balance">{point.line}</p>
            <div className="mt-1.5 wide:mt-3">
              <Credits names={point.credits} />
            </div>
          </div>
        ))}
        {/* The longest of the three: it runs down beside the link, and its
            credits stay level with it. */}
        <div className={`${POINT} wide:row-span-2 wide:flex wide:flex-col`}>
          <h3 className="t-body font-bold">{SODIUM_NOTE.title}</h3>
          <p data-sodium-note className="t-lead mt-1.5">
            {SODIUM_NOTE.text}
          </p>
          <div className="mt-1.5 wide:mt-auto wide:pt-3">
            <Credits names={SODIUM_NOTE.credits} />
          </div>
        </div>
        <Link
          href={`${LONG_READ}#why`}
          className="link t-body inline-flex min-h-11 items-center gap-2 justify-self-start max-wide:mt-1.5 wide:col-span-2 wide:-mb-2.5 wide:self-end"
        >
          Read the science
          <ArrowRight size={18} className="shrink-0" />
        </Link>
      </div>
    </section>
  );
}
