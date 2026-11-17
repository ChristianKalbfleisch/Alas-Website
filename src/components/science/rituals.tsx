import { PHOTOS } from "@/data/photos";
import { Chapter, MEASURE } from "./chapter";

type Ritual = {
  /** The part of the day it belongs to; a side column on wider screens. */
  time: string;
  name: string;
  line: string;
  when?: string;
};

const RITUALS: Ritual[] = [
  {
    time: "Morning",
    name: "The morning pinch.",
    line: "The simplest thing in your stack. A pinch of Greek sea salt in your first glass of water, next to your vitamins.",
    when: "First thing, before the coffee. A pinch in your morning water.",
  },
  {
    time: "Training",
    name: "One stick, one bottle.",
    line: "For runners, lifters and long hot days. When you sweat, you lose salt as well as water.",
    when: "Before and after training, long runs, hot days, the sauna, flights.",
  },
  {
    time: "Night",
    name: "The sea soak.",
    line: "Self-care, the slow way. Warm water, a little of the sea, and nowhere to be.",
    when: "A warm mineral soak in the bath, or a warm salt compress. For external use.",
  },
  {
    time: "At the table",
    name: "It is also a finishing salt.",
    line: "Over ripe tomatoes, good olive oil, warm bread.",
  },
];

/** Rituals: a day in three named rituals, and the table. */
export function Rituals() {
  return (
    <Chapter
      id="rituals"
      title="One mineral. Multiple rituals."
      photo={PHOTOS.kitchen}
      photoAt="50% 30%"
      lead="Water is the one habit everyone shares. Three simple ways to make it a ritual, from the first glass of the morning to a slow soak at night."
    >
      <ul className="mt-10">
        {RITUALS.map((ritual) => (
          <li
            key={ritual.name}
            className="grid gap-x-8 gap-y-2 border-line border-t py-7 last:pb-0 sm:grid-cols-[9rem_minmax(0,1fr)]"
          >
            <p className="t-body hidden pt-1 text-ink-2 sm:block">
              {ritual.time}
            </p>
            <div className={MEASURE}>
              <h3 className="t-h3">{ritual.name}</h3>
              <p className="t-body mt-2 text-ink-2">{ritual.line}</p>
              {ritual.when && (
                <dl className="t-body mt-3 flex gap-3">
                  <dt className="font-bold">When</dt>
                  <dd className="text-ink-2">{ritual.when}</dd>
                </dl>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Chapter>
  );
}
