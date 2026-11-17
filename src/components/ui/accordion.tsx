import type { ReactNode } from "react";
import { Plus } from "./icons";

type AccordionItem = { id: string; title: string; body: ReactNode };

/**
 * Questions that open in place. Native disclosure elements, so they work with
 * the keyboard, with find-in-page and without script.
 */
export function Accordion({ items }: { items: AccordionItem[] }) {
  return (
    <div className="border-line border-t">
      {items.map((item) => (
        <details key={item.id} className="group border-line border-b">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[1.25rem] leading-snug tracking-[-0.01em] hover:text-sea [&::-webkit-details-marker]:hidden">
            <span>{item.title}</span>
            <Plus
              size={24}
              className="shrink-0 transition-transform duration-300 group-open:rotate-45"
            />
          </summary>
          <div className="t-body max-w-[46rem] pb-7 text-ink-2">
            {item.body}
          </div>
        </details>
      ))}
    </div>
  );
}
