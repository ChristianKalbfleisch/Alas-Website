import clsx from "clsx";
import Image from "next/image";
import type { PackImage } from "@/data/products";

type PackShotProps = {
  image: PackImage;
  /** CSS aspect ratio of the panel. */
  ratio?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * A pack on its panel: one backdrop everywhere. A cut-out pack sits fully
 * inside the panel. A studio photograph is shown whole too, on a panel of its
 * own backdrop colour with its side edges melted into it, so the pack has
 * room around it whatever the panel's shape.
 */
export function PackShot({
  image,
  ratio = "4 / 5",
  sizes,
  priority,
  className,
}: PackShotProps) {
  return (
    <div
      className={clsx("stage", image.cover && "stage-studio", className)}
      style={{ aspectRatio: ratio }}
    >
      <Image
        key={image.src}
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        priority={priority}
        unoptimized
        className={image.cover ? undefined : "p-[8%]"}
      />
    </div>
  );
}
