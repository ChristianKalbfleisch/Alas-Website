import Image from "next/image";
import { Logo } from "@/components/ui/logo";
import { art } from "@/data/art";
import type { Product } from "@/data/products";
import { FLAVOUR_NOTE } from "@/lib/cart/catalogue";

/** "Turn it over": the back of the pack, small. Plain salt has a one-line label. */
export function MiniLabel({ product }: { product: Product }) {
  const rows: [string, string][] = [
    ["Ingredients", "Aegean sea salt"],
    ["Added", "Nothing"],
    ["Sugar, dyes, sweeteners", "None"],
    ["Harvested", "Greece"],
    ["Packaged", "USA"],
  ];
  return (
    <div>
      <p className="rule-label eyebrow justify-between">
        <span>/ Turn it over</span>
      </p>
      <p className="font-display mt-6 text-[length:var(--fs-h3)] leading-[1.15]!">
        One ingredient. That is the whole label.
      </p>
      <figure
        className="mt-8 max-w-[22rem] -rotate-2 rounded-[22px] bg-ink p-6 text-white shadow-[0_30px_60px_-30px_rgb(18_49_77_/_0.7),inset_0_1px_0_rgb(255_255_255_/_0.12)] transition-transform duration-700 ease-[var(--ease-out)] hover:rotate-0"
        aria-label={`Label: ${rows.map((r) => `${r[0]}: ${r[1]}`).join(", ")}`}
      >
        <div className="flex items-center justify-between">
          <Logo className="h-7 text-white" title="" />
          <span className="font-mono text-[9.5px] text-white/60 uppercase tracking-[0.1em]">
            {product.kind === "box" ? "The salt inside" : "Regular"}
          </span>
        </div>
        <dl className="mt-5 font-mono text-[11px] uppercase tracking-[0.06em]">
          {rows.map(([k, v]) => (
            <div
              key={k}
              className="flex items-baseline justify-between gap-4 border-white/15 border-t py-2.5"
            >
              <dt className="text-white/60">{k}</dt>
              <dd className="text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </figure>
    </div>
  );
}

/** The four real how-to frames as a strip (pouches skip the tear). */
export function HowToStrip({ product }: { product: Product }) {
  const salt = product.kind === "salt";
  const words = salt
    ? ["Pour a pinch", "Stir", "Drink"]
    : ["Tear", "Pour", "Stir", "Drink"];
  const frames = salt ? art.howto.slice(1) : art.howto;
  return (
    <div>
      <p className="rule-label eyebrow justify-between">
        <span>/ How to use</span>
        <span className="text-ink-3!">
          {salt ? "A pinch in your water" : "One stick, one bottle"}
        </span>
      </p>
      <ol
        className="-mx-[var(--gutter)] mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--gutter)] [scrollbar-width:none] sm:mx-0 sm:grid sm:gap-4 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
        style={{
          gridTemplateColumns: `repeat(${frames.length}, minmax(0, 1fr))`,
        }}
      >
        {frames.map((frame, i) => (
          <li key={frame.src} className="w-[68%] shrink-0 snap-start sm:w-auto">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-lime">
              <Image
                src={frame.src}
                alt={frame.alt}
                fill
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 68vw"
                className="object-cover"
              />
            </div>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-[11px] text-ink-3">0{i + 1}</span>
              <span className="font-display text-[1.3rem] leading-none!">
                {words[i]}
              </span>
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Three short answers, only from the content facts. */
export function ProductFaq({ product }: { product: Product }) {
  const use: Record<Product["kind"], string> = {
    salt: "A pinch in your water, stirred until it disappears. It is also a finishing salt for food.",
    sticks:
      "Tear the stick, pour it into your bottle, shake or stir, and drink. One stick, one bottle.",
    box: "A pinch in your morning water, or one stick in your bottle.",
  };
  const items: [string, string][] = [
    ["How do I use it?", use[product.kind]],
    [
      "What is in it?",
      `Aegean sea salt, harvested in Greece and packaged in the USA. Unrefined, dried by sun and wind, nothing added.${product.flavours ? ` ${FLAVOUR_NOTE}.` : ""}`,
    ],
    [
      "Is it right for me?",
      "If you are on a sodium-restricted diet or have a medical condition, check with your doctor first.",
    ],
  ];
  return (
    <div>
      <p className="rule-label eyebrow justify-between">
        <span>/ Questions</span>
      </p>
      <div className="mt-4">
        {items.map(([q, a]) => (
          <details
            key={q}
            className="group border-[var(--c-line)] border-b py-5 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6">
              <span className="font-display text-[1.45rem] leading-[1.15]!">
                {q}
              </span>
              <span
                aria-hidden
                className="grid size-9 shrink-0 place-items-center rounded-full shadow-[inset_0_0_0_1px_var(--c-line-strong)] transition-transform duration-500 ease-[var(--ease-out)] group-open:rotate-45"
              >
                <svg viewBox="0 0 12 12" className="size-3">
                  <path
                    d="M2 6h8M6 2v8"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                </svg>
              </span>
            </summary>
            <p className="mt-3 max-w-[56ch] text-[15px] text-ink-2 leading-relaxed">
              {a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
