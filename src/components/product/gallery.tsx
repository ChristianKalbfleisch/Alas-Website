"use client";

import clsx from "clsx";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useOffer } from "@/components/campaign/use-offer";
import { PHOTOS, type Photo } from "@/data/photos";
import { type PackImage, type Product, shotFor } from "@/data/products";

/** One picture in the gallery: the pack on its panel, or a photograph with one line on it. */
type Slide =
  | { kind: "pack"; image: PackImage }
  | { kind: "photo"; photo: Photo; line: string; at?: string };

const shot = (photo: Photo, line: string, at?: string): Slide => ({
  kind: "photo",
  photo,
  line,
  at,
});

/**
 * The pack first, in the amount picked; then photographs that each say one
 * thing; then the other pack views.
 */
function slidesFor(product: Product, qty: number): Slide[] {
  const packs: Slide[] = product.images.map((image, i) => ({
    kind: "pack",
    image: i === 0 ? shotFor(product, qty) : image,
  }));
  const lemon = product.flavour === "Lemon";
  let photos: Slide[];
  if (product.kind === "sticks") {
    photos = lemon
      ? [
          shot(PHOTOS.ledgeLemon, "The same salt, with lemon.", "74% 100%"),
          shot(PHOTOS.lemon, "A bright citrus note."),
        ]
      : [
          shot(PHOTOS.ledgeBottle, "A stick in your bottle.", "86% 100%"),
          shot(PHOTOS.pour, "Tear, pour, stir."),
          shot(PHOTOS.toteSticks, "Wherever the day takes you.", "60% 70%"),
        ];
  } else if (product.kind === "set") {
    photos = [
      shot(PHOTOS.stillSun, "A pouch for home, sticks for the road."),
      shot(PHOTOS.pour, "Tear, pour, stir."),
      shot(PHOTOS.plate, "And on your plate."),
    ];
  } else {
    photos = lemon
      ? [
          shot(PHOTOS.ledgeLemon, "The same salt, with lemon.", "74% 100%"),
          shot(PHOTOS.lemon, "A bright citrus note."),
          shot(PHOTOS.glassPinch, "A pinch in your glass.", "64% 50%"),
          shot(PHOTOS.crystals, "Fine crystals, 0.5 to 2 mm.", "78% 50%"),
        ]
      : [
          shot(PHOTOS.ledgeGlass, "A pinch in your glass.", "80% 100%"),
          shot(PHOTOS.stillSun, "Greek fleur de sel, gathered by hand."),
          shot(PHOTOS.plate, "And on your plate."),
          shot(PHOTOS.crystals, "Fine crystals, 0.5 to 2 mm.", "78% 50%"),
        ];
  }
  return [packs[0], ...photos, ...packs.slice(1)];
}

/**
 * The width a photograph is drawn at in the gallery's square box. A wide
 * photograph fills the box by its height, so it is drawn wider than the box.
 */
const coverSizes = (photo: Photo) => {
  const wider = Math.max(1, photo.src.width / photo.src.height);
  return `(min-width: 50rem) ${Math.ceil(52 * wider)}vw, ${Math.ceil(92 * wider)}vw`;
};

const slideKey = (slide: Slide) =>
  slide.kind === "pack" ? slide.image.src : slide.photo.src.src;
const slideAlt = (slide: Slide) =>
  slide.kind === "pack" ? slide.image.alt : slide.photo.alt;

/** How many of a product its largest picture shows. */
const mostShown = (product: Product) =>
  Math.max(1, ...Object.keys(product.counts ?? {}).map(Number));

/** A product's pictures: one large, and a strip to pick from. */
export function Gallery({ product, qty }: { product: Product; qty: number }) {
  const top = useOffer().top.percent;
  const slides = slidesFor(product, qty);
  const [index, setIndex] = useState(0);
  const slide = slides[Math.min(index, slides.length - 1)];
  // Picking another amount brings the pack back into view.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the amount changes
  useEffect(() => setIndex(0), [qty]);
  return (
    <div className="min-w-0 wide:sticky wide:top-[calc(var(--header-h)+var(--bar-h)+1.5rem)] wide:self-start">
      {slide.kind === "pack" ? (
        <div
          className={clsx(
            "stage aspect-square max-h-[64svh]",
            slide.image.cover && "stage-studio",
          )}
        >
          <Image
            key={slide.image.src}
            src={slide.image.src}
            alt={slide.image.alt}
            width={slide.image.width}
            height={slide.image.height}
            priority
            unoptimized
            sizes="(min-width: 1024px) 52vw, 92vw"
            className={slide.image.cover ? undefined : "p-[7%]"}
          />
          {index === 0 && (
            <span className="chip chip-navy absolute top-4 left-4">
              Up to {top}% off
            </span>
          )}
          {index === 0 && product.counts && qty > mostShown(product) && (
            <span className="chip chip-paper absolute bottom-4 left-4">
              {mostShown(product)} of {qty} shown
            </span>
          )}
        </div>
      ) : (
        <figure className="photo aspect-square max-h-[64svh] rounded-[var(--radius-card)]!">
          <Image
            key={slide.photo.src.src}
            src={slide.photo.src}
            alt={slide.photo.alt}
            placeholder="blur"
            sizes={coverSizes(slide.photo)}
            style={{ objectPosition: slide.at }}
          />
          <figcaption className="photo-caption t-h3">{slide.line}</figcaption>
        </figure>
      )}
      <ul className="strip mt-3 gap-2.5! px-0! pb-1">
        {slides.map((thumb, i) => (
          <li key={i === 0 ? "pack" : slideKey(thumb)} className="shrink-0">
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}: ${slideAlt(thumb)}`}
              aria-current={i === index}
              className={clsx(
                "stage size-[4.5rem] rounded-xl sm:size-20",
                i === index
                  ? "shadow-[inset_0_0_0_2px_var(--color-navy)]"
                  : "opacity-80 hover:opacity-100",
              )}
            >
              {thumb.kind === "pack" ? (
                <Image
                  src={thumb.image.thumb}
                  alt=""
                  width={192}
                  height={192}
                  unoptimized
                  className="p-2"
                />
              ) : (
                <Image
                  src={thumb.photo.src}
                  alt=""
                  sizes="5rem"
                  className="object-cover!"
                  style={{ objectPosition: thumb.at }}
                />
              )}
            </button>
          </li>
        ))}
      </ul>
      <p className="t-fine mt-3 text-ink-2">
        Pre-production packaging shown. Final packs may vary.
      </p>
    </div>
  );
}
