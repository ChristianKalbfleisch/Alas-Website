import clsx from "clsx";
import Image from "next/image";
import type { ReactNode } from "react";
import type { Photo } from "@/data/photos";
import type { Chapter as ChapterKey } from "@/data/sources";
import { ChapterSources } from "./chapter-sources";

/** The width of running text: about 70 characters to a line. */
export const MEASURE = "max-w-[34rem]";

type ChapterProps = {
  /** The anchor other pages link to. */
  id: string;
  title: ReactNode;
  /** One larger sentence under the title. */
  lead?: ReactNode;
  /** A photograph under the opening lines. */
  photo?: Photo;
  /** Which part of the photograph to keep when it is cropped, e.g. "64% 50%". */
  photoAt?: string;
  /** Lists this chapter's credits under it. */
  sources?: ChapterKey;
  children: ReactNode;
};

/** One chapter of the long read: a title, its content, then its sources. */
export function Chapter({
  id,
  title,
  lead,
  photo,
  photoAt,
  sources,
  children,
}: ChapterProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="border-line border-t py-[clamp(3.5rem,2.5rem+4vw,6rem)] first:border-t-0 first:pt-0"
    >
      <h2 id={`${id}-title`} className="t-h2 max-w-[44rem] text-balance">
        {title}
      </h2>
      {lead && (
        <p className={clsx("t-lead mt-5 text-ink-2", MEASURE)}>{lead}</p>
      )}
      {photo && (
        <figure className="photo mt-9 aspect-[16/9] max-w-[52rem]">
          <Image
            src={photo.src}
            alt={photo.alt}
            placeholder="blur"
            sizes="(min-width: 64rem) 52rem, 92vw"
            style={{ objectPosition: photoAt }}
          />
        </figure>
      )}
      {children}
      {sources && <ChapterSources chapter={sources} />}
    </section>
  );
}

/** Paragraphs of running text, held to the reading measure. */
export function Prose({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("t-body grid gap-4 text-ink-2", MEASURE, className)}>
      {children}
    </div>
  );
}
