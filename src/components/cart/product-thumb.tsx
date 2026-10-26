import clsx from "clsx";
import Image from "next/image";
import { POUCH_CUTOUT, type Product } from "@/data/products";
import "./commerce.css";

/** Small real-photo stack of 1, 2 or 4 pouches, each with a soft contact shadow. */
const STACKS: Record<number, { x: number; y: number; s: number }[]> = {
  1: [{ x: 0, y: 0, s: 1 }],
  2: [
    { x: -17, y: 0, s: 0.92 },
    { x: 19, y: -4, s: 0.82 },
  ],
  4: [
    { x: -30, y: 0, s: 0.78 },
    { x: -10, y: -3, s: 0.72 },
    { x: 9, y: -6, s: 0.66 },
    { x: 27, y: -9, s: 0.6 },
  ],
};

export function PouchStack({
  count,
  className,
  sizes = "96px",
}: {
  count: number;
  className?: string;
  sizes?: string;
}) {
  const slots = STACKS[count] ?? STACKS[1];
  return (
    <div className={clsx("relative h-full w-full", className)} aria-hidden>
      {slots.map((slot, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed stack slots
          key={i}
          className="absolute bottom-[13%] left-1/2 w-[46%]"
          style={{
            transform: `translate(calc(-50% + ${slot.x}%), ${slot.y}%) scale(${slot.s})`,
            transformOrigin: "50% 100%",
            zIndex: 10 - i,
          }}
        >
          <span className="-bottom-[3%] absolute inset-x-[4%] h-[9%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(10_20_34_/_0.45),rgb(10_20_34_/_0))]" />
          <Image
            src={POUCH_CUTOUT.src}
            width={POUCH_CUTOUT.width}
            height={POUCH_CUTOUT.height}
            alt=""
            sizes={sizes}
            className={clsx(
              "cm-pouch-clip",
              "relative h-auto w-full",
              i > 0 && "brightness-[0.9]",
            )}
          />
        </div>
      ))}
    </div>
  );
}

/** The right small picture for any product: pouch stack for salt, the photo otherwise. */
export function ProductThumb({
  product,
  className,
  sizes = "96px",
}: {
  product: Product;
  className?: string;
  sizes?: string;
}) {
  if (product.kind === "salt") {
    return (
      <PouchStack
        count={product.pouches ?? 1}
        className={className}
        sizes={sizes}
      />
    );
  }
  const image = product.images[0];
  return (
    <div className={clsx("cm-multiply relative h-full w-full", className)}>
      <Image
        src={image.src}
        width={image.width}
        height={image.height}
        alt=""
        sizes={sizes}
        className="cm-whiten h-full w-full object-contain p-[6%]"
      />
    </div>
  );
}
