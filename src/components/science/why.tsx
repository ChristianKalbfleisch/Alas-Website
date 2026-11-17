import clsx from "clsx";
import type { ReactNode } from "react";
import { PHOTOS } from "@/data/photos";
import { Chapter, Prose } from "./chapter";
import { SodiumNote } from "./sodium-note";

const SALTS = [
  {
    name: "Refined table salt",
    body: "Processed to remove everything but the salt. Anti-caking agents such as calcium silicate are often added.",
  },
  {
    name: "ALAS Greek sea salt",
    body: "Unrefined, so it keeps small amounts of the minerals that were in the seawater, like magnesium, potassium and calcium.",
  },
];

/** Ingredient types, not any one brand's label. */
const SPORTS_DRINK = [
  "Water",
  "Sugar or sweeteners",
  "Acids",
  "Electrolyte salts",
  "Flavorings",
  "Stabilizers",
  "Colors",
];

/**
 * One label. Side by side, the two cards share their rows, so the titles,
 * the ingredients and the small print line up whatever wraps.
 */
function LabelCard({
  title,
  variant,
  note,
  navy = false,
  children,
}: {
  title: string;
  /** The flavour, set lighter after the name. */
  variant?: string;
  /** The small print under the ingredients. */
  note: string;
  navy?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={clsx(
        "grid gap-y-0 rounded-[var(--radius-panel)] p-7 sm:p-9 md:row-span-4 md:grid-rows-subgrid",
        navy ? "bg-navy text-white" : "bg-mist",
      )}
    >
      <h4 className="text-[1.25rem] leading-tight font-bold">
        {variant ? (
          <>
            <span className="whitespace-nowrap">{title}</span>{" "}
            <span className="font-normal">{variant}</span>
          </>
        ) : (
          title
        )}
      </h4>
      <p
        className={clsx(
          "t-small mt-6 border-t pt-5 font-bold",
          navy ? "border-white/15" : "border-line",
        )}
      >
        Ingredients
      </p>
      <div className="mt-3">{children}</div>
      <p
        className={clsx(
          "t-small self-end pt-8",
          navy ? "text-white/75" : "text-ink-2",
        )}
      >
        {note}
      </p>
    </div>
  );
}

/** Why salt in water: what sweat carries, what refining does, and two labels side by side. */
export function Why() {
  return (
    <Chapter
      id="why"
      title="You don’t just sweat water."
      photo={PHOTOS.glassPinch}
      photoAt="70% 50%"
      sources="why"
    >
      <Prose className="mt-5">
        <p className="t-lead text-ink">
          When you sweat, you lose salt as well as water. Mainly sodium.
        </p>
        <p>
          Sweat carries water and electrolytes, and sodium is the one lost in
          the greatest amount. Smaller amounts of the others go too.
        </p>
        <p>
          Sodium is one of the electrolytes that help balance the water in your
          body.
        </p>
        <p>
          A pinch of sea salt puts a little sodium in your glass. Each serving’s
          amount is on the label.
        </p>
      </Prose>

      <div className="mt-14 max-w-[44rem]">
        <h3 className="t-h3">Not all salt is the same.</h3>
        <p className="t-body mt-2 text-ink-2">
          What’s done to salt decides what’s in it.
        </p>
        <dl className="mt-6">
          {SALTS.map((salt) => (
            <div
              key={salt.name}
              className="border-line border-t py-5 last:border-b"
            >
              <dt className="text-[1.25rem] leading-tight font-bold">
                {salt.name}
              </dt>
              <dd className="t-body mt-1.5 max-w-[32rem] text-ink-2">
                {salt.body}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-14">
        <h3 className="t-h3">Turn it over.</h3>
        <div className="mt-6 grid gap-5 md:grid-cols-2 md:grid-rows-[auto_auto_1fr_auto]">
          <LabelCard
            title="A typical sports drink"
            note="Illustrative. Ingredients vary by brand and flavor."
          >
            <ul className="t-body grid gap-1">
              {SPORTS_DRINK.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </LabelCard>
          <LabelCard
            navy
            title="Greek Fleur de Sel"
            variant="Classic"
            note="ALAS Classic. Flavored versions differ."
          >
            <p className="text-balance text-[clamp(1.625rem,1.1rem+1.5vw,2.25rem)] leading-[1.1] tracking-[-0.025em]">
              Sea salt (fleur de sel).
            </p>
          </LabelCard>
        </div>
      </div>

      <SodiumNote />
    </Chapter>
  );
}
