import clsx from "clsx";
import type { ReactNode } from "react";
import { Chapter } from "./chapter";

function WordCard({
  word,
  title,
  navy = false,
  children,
}: {
  /** The Greek word, set large. */
  word: string;
  title: string;
  navy?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-panel)] p-7 sm:p-9",
        navy ? "bg-navy text-white" : "bg-mist",
      )}
    >
      <p
        lang="grc"
        className="text-[clamp(4rem,3rem+4vw,6.5rem)] leading-none tracking-[-0.02em]"
      >
        {word}
      </p>
      <h3 className="t-h3 mt-8">{title}</h3>
      <p className={clsx("t-body mt-2", navy ? "text-white/75" : "text-ink-2")}>
        {children}
      </p>
    </div>
  );
}

/** The word: the name in Greek, and the older word it comes from. */
export function Word() {
  return (
    <Chapter id="alas" title="Our name, in Greek." sources="alas">
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <WordCard navy word="ἅλας" title="Greek for salt.">
          Say it: AH-las. It is the salt in “you are the salt of the earth”.
        </WordCard>
        <WordCard word="ἅλς" title="Salt and sea, one word.">
          In the oldest Greek, <span lang="grc">ἅλς</span> meant both. Sea salt
          still does.
        </WordCard>
      </div>
    </Chapter>
  );
}
