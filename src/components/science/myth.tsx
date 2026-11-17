import { Chapter, MEASURE, Prose } from "./chapter";

/** Myth and history: two stories people still repeat, told as stories. */
export function Myth() {
  return (
    <Chapter id="myth" title="Two old stories about salt." sources="myth">
      <div className={`mt-10 grid gap-10 ${MEASURE}`}>
        <div>
          <h3 className="t-h3">Legend says salt was a wage.</h3>
          <p className="t-body mt-2 text-ink-2">
            Roman soldiers, the story goes, were paid in salt, and Pliny tied
            the word salary to it. Historians find no proof. We like it anyway.
          </p>
        </div>

        <div>
          <h3 className="t-h3">To share salt was to be friends.</h3>
          <p className="t-body mt-2 text-ink-2">
            A Greek saying held that you only know someone once you have eaten
            salt together. Sharing salt at a table meant friendship.
          </p>
          <figure className="mt-6 rounded-[var(--radius-card)] bg-mist p-6 sm:p-8">
            <blockquote>
              <p
                lang="grc"
                className="text-[1.5rem] leading-snug tracking-[-0.01em] text-navy"
              >
                ποῦ δ᾽ ἅλες; ποῦ τράπεζα;
              </p>
              <p className="t-body mt-2 text-ink">
                Where is the salt? Where is the table?
              </p>
            </blockquote>
            <figcaption className="t-small mt-3 text-ink-2">
              Demosthenes, on a broken friendship
            </figcaption>
          </figure>
        </div>
      </div>

      <Prose className="mt-10">
        <p>
          Homer calls salt divine. Plato reports that salt was called dear to
          the gods.
        </p>
        <p className="t-h3 text-ink">Now it’s your turn to pass the salt.</p>
      </Prose>
    </Chapter>
  );
}
