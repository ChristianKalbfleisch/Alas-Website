import { type Chapter, sourcesFor } from "@/data/sources";

/** The credits for one chapter, right under it: numbered, each linked to the full list. */
export function ChapterSources({ chapter }: { chapter: Chapter }) {
  const sources = sourcesFor(chapter);
  if (sources.length === 0) return null;
  return (
    <aside
      aria-label="Sources for this chapter"
      className="t-small mt-12 flex flex-col gap-x-6 gap-y-1 sm:flex-row sm:items-baseline"
    >
      <p className="shrink-0 font-bold">Sources</p>
      <ol className="flex flex-wrap gap-x-5 text-ink-2">
        {sources.map((source) => (
          <li key={source.n}>
            <a href={`#source-${source.n}`} className="link inline-block py-1">
              <span className="t-price">{source.n}</span> {source.short}
            </a>
          </li>
        ))}
      </ol>
    </aside>
  );
}
