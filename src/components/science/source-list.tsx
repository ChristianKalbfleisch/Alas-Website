import { CHAPTER_TITLES, type Chapter, sourcesFor } from "@/data/sources";
import { MEASURE } from "./chapter";

const CHAPTERS = Object.keys(CHAPTER_TITLES) as Chapter[];

/**
 * The full list, grouped by chapter and numbered in page order, every entry
 * linked to where it can be read. Chapter strips point at these anchors.
 */
export function SourceList() {
  return (
    <section
      id="sources"
      aria-labelledby="sources-title"
      className="border-line border-t pt-[clamp(3.5rem,2.5rem+4vw,6rem)]"
    >
      <h2 id="sources-title" className="t-h2 max-w-[44rem] text-balance">
        Where every fact comes from.
      </h2>
      <p className={`t-lead mt-5 text-ink-2 ${MEASURE}`}>
        Old texts link to public translations; anything about the body links to
        government or peer-reviewed sources. Nothing here is medical advice.
      </p>

      {CHAPTERS.map((chapter) => {
        const sources = sourcesFor(chapter);
        if (sources.length === 0) return null;
        return (
          <div key={chapter} className="mt-12">
            <h3 className="t-h3">{CHAPTER_TITLES[chapter]}</h3>
            <ol
              start={sources[0].n}
              className="mt-4 grid gap-x-12 border-line border-b md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
            >
              {sources.map((source) => (
                <li
                  key={source.n}
                  id={`source-${source.n}`}
                  className="relative isolate grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 border-line border-t py-5 target:before:absolute target:before:-inset-x-3 target:before:inset-y-0 target:before:-z-10 target:before:bg-mist"
                >
                  <span className="t-body t-price text-sea">{source.n}</span>
                  <div>
                    <p className="t-body">{source.claim}</p>
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link t-small mt-1.5 inline-block break-words text-ink-2"
                      >
                        {source.credit}
                      </a>
                    ) : (
                      <p className="t-small mt-1.5 text-ink-2">
                        {source.credit}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </section>
  );
}
