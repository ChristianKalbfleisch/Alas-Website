import { getProduct, POUCH_SERVINGS as SERVINGS } from "@/data/products";

const pouchPrice = getProduct("classic-pouch")?.price ?? null;

/** Four numbers from the label, the range and the price list. */
const FACTS = [
  { figure: "1", line: "staple ingredient: sea salt" },
  { figure: "2", line: "distinct flavours: Classic and Lemon" },
  {
    figure: String(SERVINGS),
    line: "quarter-teaspoon servings in each Classic pouch",
  },
  pouchPrice === null
    ? { figure: "2.5 g", line: "in every stick" }
    : {
        figure: `${Math.round((pouchPrice / SERVINGS) * 100)}\u00a2`,
        line: "a serving",
      },
];

/**
 * The product in four numbers, straight under the first screen. Each number
 * stands before its caption in the page itself, so it is read out and copied
 * in the order it is seen.
 */
export function Facts() {
  return (
    <section aria-label="ÁLAS in four numbers" className="border-line border-b">
      <ul className="wrap grid grid-cols-2 wide:grid-cols-4">
        {FACTS.map((fact, i) => (
          <li
            key={fact.line}
            className={
              "flex flex-col gap-1 py-4 sm:py-9 " +
              (i % 2 ? "pl-5 sm:pl-8 " : "pr-5 sm:pr-8 ") +
              (i % 2 ? "border-line border-l " : "") +
              (i >= 2 ? "max-wide:border-line max-wide:border-t " : "") +
              (i > 0 ? "wide:border-line wide:border-l wide:pl-8 " : "") +
              (i < FACTS.length - 1 ? "wide:pr-8" : "")
            }
          >
            <span className="t-price text-[clamp(2.25rem,1.6rem+2.4vw,3.5rem)] leading-none tracking-[-0.035em] text-navy">
              {fact.figure}
            </span>{" "}
            <span className="t-body text-balance text-ink-2">{fact.line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
