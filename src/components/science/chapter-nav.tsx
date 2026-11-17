/** The chapters in page order. Other pages link to these anchors. */
const CHAPTERS = [
  { href: "#alas", label: "The word" },
  { href: "#myth", label: "Myth and history" },
  { href: "#origin", label: "How it is made" },
  { href: "#why", label: "Why salt in water" },
  { href: "#rituals", label: "Rituals" },
  { href: "#sources", label: "Sources" },
];

/**
 * The chapter list: a panel above the first chapter on small screens, a column
 * that stays beside the text on wide ones.
 */
export function ChapterNav() {
  return (
    <nav
      aria-labelledby="chapters-title"
      className="rounded-[var(--radius-card)] bg-mist p-6 lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start lg:rounded-none lg:bg-transparent lg:p-0"
    >
      <h2 id="chapters-title" className="text-[1.0625rem] font-bold">
        Chapters
      </h2>
      <ol className="mt-2 grid grid-cols-2 gap-x-6 lg:grid-cols-1">
        {CHAPTERS.map((chapter) => (
          <li key={chapter.href}>
            <a
              href={chapter.href}
              className="block py-2.5 text-[1.0625rem] text-ink-2 transition-colors hover:text-sea"
            >
              {chapter.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
