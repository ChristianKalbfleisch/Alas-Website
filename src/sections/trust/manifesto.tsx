import { Fragment } from "react";
import { RevealText } from "@/components/motion/reveal-text";

type ManifestoProps = { lead: string; rest: string };

/** Renders *word* as the single italic emphasis. */
function withEmphasis(text: string) {
  return text.split(/(\*[^*]+\*)/).map((part, i) => {
    const key = `${i}-${part}`;
    return part.startsWith("*") ? (
      <em key={key}>{part.slice(1, -1)}</em>
    ) : (
      <Fragment key={key}>{part}</Fragment>
    );
  });
}

/**
 * What we believe, in one breath: Garamond, sentence case, revealed word by
 * word at a set scroll point (time-based, never scrubbed).
 */
export function Manifesto({ lead, rest }: ManifestoProps) {
  const size = "text-[length:clamp(2.35rem,1.2rem+3.9vw,5.6rem)]";
  return (
    <div>
      <RevealText
        as="h2"
        by="words"
        stagger={0.045}
        className={`font-display text-balance ${size} text-ink`}
      >
        {lead}
      </RevealText>
      <RevealText
        as="p"
        by="words"
        stagger={0.035}
        delay={0.25}
        className={`font-display max-w-[22ch] ${size} text-ink-2`}
      >
        {withEmphasis(rest)}
      </RevealText>
    </div>
  );
}
