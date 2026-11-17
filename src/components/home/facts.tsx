import { getProduct, POUCH_SERVINGS as SERVINGS } from "@/data/products";

const pouchPrice = getProduct("classic-pouch")?.price ?? null;

/** Four numbers from the label, the range and the price list. */
const FACTS = [
  { figure: "1", line: "ingredient in Classic: sea salt" },
  { figure: "2", line: "flavours, Classic and Lemon" },
  { figure: String(SERVINGS), line: "servings in every pouch, about" },
  pouchPrice === null
    ? { figure: "2.5 g", line: "in every stick" }
    : {
        figure: `${Math.round((pouchPrice / SERVINGS) * 100)}\u00a2`,
        line: "a serving from the pouch, about",
      },
];

/** The product in four numbers, straight under the first screen. */
export function Facts() {
  return (
    <section aria-label="ALAS in four numbers" className="border-line border-b">
      <dl className="wrap grid grid-cols-2 wide:grid-cols-4">
        {FACTS.map((fact, i) => (
          <div
            key={fact.line}
            className={
              "flex flex-col-reverse gap-1 py-7 sm:py-9 " +
              (i % 2 ? "pl-5 sm:pl-8 " : "pr-5 sm:pr-8 ") +
              (i % 2 ? "border-line border-l " : "") +
              (i >= 2 ? "max-wide:border-line max-wide:border-t " : "") +
              (i > 0 ? "wide:border-line wide:border-l wide:pl-8 " : "")
            }
          >
            <dt className="t-body text-ink-2">{fact.line}</dt>
            <dd className="t-price text-[clamp(2.25rem,1.6rem+2.4vw,3.5rem)] leading-none tracking-[-0.035em] text-navy">
              {fact.figure}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
