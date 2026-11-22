import Image from "next/image";
import { Check } from "@/components/ui/icons";
import { PACKS } from "@/data/pack-sizes";

const [pouch, , pouchWidth, pouchHeight] = PACKS["pouch-classic-cut"];

/** Ingredient types only, never a named brand. */
const ROWS: { label: string; alas: string; drink: string; table: string }[] = [
  {
    label: "Ingredients",
    alas: "One: sea salt",
    drink: "Often seven or more",
    table: "Salt, often with additives",
  },
  {
    label: "Sugar or sweeteners",
    alas: "None",
    drink: "Usually",
    table: "None",
  },
  {
    label: "Colors and flavorings",
    alas: "None",
    drink: "Usually",
    table: "None",
  },
  {
    label: "Anti-caking agents",
    alas: "None",
    drink: "Not usually",
    table: "Often, such as calcium silicate",
  },
];

/** What is in the glass, in a table, with the pouch standing on its own column. */
export function Compare() {
  return (
    <section aria-labelledby="compare-title" className="section bg-mist">
      <div className="wrap">
        <h2 id="compare-title" className="t-h2 max-w-[16ch]">
          What is actually in your glass.
        </h2>
        <ul className="mt-8 grid gap-4 md:hidden">
          {ROWS.map((row) => (
            <li
              key={row.label}
              className="overflow-hidden rounded-[var(--radius-card)] bg-paper"
            >
              <h3 className="px-5 pt-5 text-[1.1875rem] font-bold">
                {row.label}
              </h3>
              <dl className="mt-4 text-[1.0625rem]">
                <div className="flex items-center justify-between gap-4 bg-navy px-5 py-3.5 text-white">
                  <dt className="font-bold">ALAS Classic</dt>
                  <dd className="flex items-center gap-2 text-right">
                    <Check
                      size={18}
                      strokeWidth={2}
                      className="shrink-0 text-wave"
                    />
                    {row.alas}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-line border-b px-5 py-3.5">
                  <dt>A typical sports drink</dt>
                  <dd className="text-right text-ink-2">{row.drink}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <dt>Table salt</dt>
                  <dd className="text-right text-ink-2">{row.table}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        <div className="rise relative mt-32 hidden md:block">
          <Image
            src={`/packs/${pouch}`}
            alt=""
            width={pouchWidth}
            height={pouchHeight}
            unoptimized
            className="pointer-events-none absolute bottom-full left-[calc(52%-7.5rem)] h-[7.5rem] w-auto drop-shadow-[0_10px_14px_rgb(1_21_36/0.25)]"
          />
          <div className="overflow-hidden rounded-[var(--radius-panel)] bg-paper">
            <table className="w-full border-collapse text-left text-[1.0625rem]">
              <thead>
                <tr>
                  <th className="w-[26%] p-5 sm:p-6">
                    <span className="sr-only">What</span>
                  </th>
                  <th className="w-[26%] bg-navy p-5 text-[1.1875rem] font-bold text-white sm:p-6">
                    ALAS Classic
                  </th>
                  <th className="p-5 font-bold sm:p-6">
                    A typical sports drink
                  </th>
                  <th className="p-5 font-bold sm:p-6">Table salt</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label} className="border-line border-t">
                    <th scope="row" className="p-5 font-bold sm:p-6">
                      {row.label}
                    </th>
                    <td className="bg-navy p-5 text-white sm:p-6">
                      <span className="flex items-center gap-2.5">
                        <Check
                          size={20}
                          strokeWidth={2}
                          className="shrink-0 text-wave"
                        />
                        {row.alas}
                      </span>
                    </td>
                    <td className="p-5 text-ink-2 sm:p-6">{row.drink}</td>
                    <td className="p-5 text-ink-2 sm:p-6">{row.table}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="t-small mt-5 text-ink-2">
          Typical ingredient lists, not any one brand.
        </p>
      </div>
    </section>
  );
}
