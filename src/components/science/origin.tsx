import { Hand, Sea, Sun } from "@/components/ui/icons";
import { PHOTOS } from "@/data/photos";
import { Chapter } from "./chapter";

const STEPS = [
  {
    title: "The sea",
    line: "Seawater fills shallow pans by the shore.",
  },
  {
    title: "Sun and wind",
    line: "The sun and the wind evaporate it, slowly. Salt makers call it solar evaporation.",
  },
  {
    title: "The flower of salt",
    line: "Crystals bloom on the surface. Fleur de sel, the flower of salt.",
  },
  {
    title: "Gathered by hand",
    line: "As the brine thickens in the sun and wind, a delicate layer of crystals forms on top, and harvesters skim it off by hand.",
  },
];

/** The chapter's closing line in its three parts, each with its own drawing. */
const KEPT = [
  { icon: Hand, label: "Hand-harvested." },
  { icon: Sun, label: "Sun-dried." },
  { icon: Sea, label: "Nothing added." },
];

/** Where it comes from and how it is made, in four steps. */
export function Origin() {
  return (
    <Chapter
      id="origin"
      title="Greece."
      lead="Hand-harvested from Mediterranean salt pans, then packed in California."
      photo={PHOTOS.harvest}
      photoAt="60% 60%"
      sources="origin"
    >
      <div className="mt-10 max-w-[44rem]">
        <h3 className="t-h3">How it is made</h3>
        <ol className="mt-5">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="grid grid-cols-[2.75rem_1fr] gap-x-4 border-line border-t py-6 last:border-b"
            >
              <span
                aria-hidden
                className="t-price text-[1.375rem] leading-[1.3] text-sea"
              >
                {i + 1}
              </span>
              <div>
                <h4 className="text-[1.25rem] leading-tight font-bold">
                  {step.title}
                </h4>
                <p className="t-body mt-1.5 max-w-[32rem] text-ink-2">
                  {step.line}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10 rounded-[var(--radius-panel)] bg-navy p-7 text-white sm:p-10">
        <ul className="grid gap-5 xl:grid-cols-3">
          {KEPT.map((item) => (
            <li key={item.label} className="flex items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-full border border-white/25">
                <item.icon size={28} />
              </span>
              <span className="text-[1.25rem] leading-tight font-bold">
                {item.label}
              </span>
            </li>
          ))}
        </ul>
        <p className="t-body mt-7 border-white/15 border-t pt-6 text-white/75">
          The salt is kept in its original form. No anti-caking agents, no
          additives.
        </p>
      </div>
    </Chapter>
  );
}
