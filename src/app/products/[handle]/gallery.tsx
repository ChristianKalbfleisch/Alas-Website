"use client";

import clsx from "clsx";
import Image from "next/image";
import {
  forwardRef,
  type PointerEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import "@/components/cart/commerce.css";

export type GalleryImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Product shot on white: sits on the stone plate and drops its white. */
  onWhite: boolean;
  /** Pouch fronts stay small: their on-pack lines are not for close reading. */
  noZoom?: boolean;
};

export type GalleryHandle = { current: () => HTMLElement | null };

/**
 * Catalogue plate gallery. One swipeable strip (scroll snap) on every screen;
 * thumbs on desktop; a loupe zoom follows the cursor on hover (not on pouch fronts).
 */
export const Gallery = forwardRef<
  GalleryHandle,
  { images: GalleryImage[]; className?: string }
>(function Gallery({ images, className }, handle) {
  const strip = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);

  useImperativeHandle(handle, () => ({
    current: () =>
      strip.current?.querySelector<HTMLElement>(
        `[data-slide="${index}"] img`,
      ) ?? null,
  }));

  const go = useCallback(
    (i: number) => {
      const el = strip.current;
      if (!el) return;
      const next = Math.max(0, Math.min(images.length - 1, i));
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
      setIndex(next);
    },
    [images.length],
  );

  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
    };
  }, []);

  const loupe = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    target.style.setProperty(
      "--zx",
      `${((event.clientX - rect.left) / rect.width) * 100}%`,
    );
    target.style.setProperty(
      "--zy",
      `${((event.clientY - rect.top) / rect.height) * 100}%`,
    );
  };

  return (
    <div className={className}>
      <div className="relative">
        <div
          ref={strip}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-[var(--r-lg)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, i) => (
            <div
              key={image.src}
              data-slide={i}
              className="relative aspect-square w-full shrink-0 snap-center overflow-hidden"
              style={{
                background:
                  "radial-gradient(90% 70% at 70% 12%, rgb(255 251 242 / 0.95), rgb(255 251 242 / 0) 70%), linear-gradient(180deg, #f1ece4 0%, #ebe4d9 62%, #f3eee7 100%)",
              }}
            >
              <div
                onPointerMove={loupe}
                onPointerEnter={(e) =>
                  e.pointerType === "mouse" && setZoom(true)
                }
                onPointerLeave={() => setZoom(false)}
                className={clsx(
                  "absolute inset-0 transition-transform duration-700 ease-[var(--ease-out)] [transform-origin:var(--zx,50%)_var(--zy,50%)]",
                  image.onWhite && "cm-multiply",
                  image.noZoom
                    ? "scale-100"
                    : zoom && i === index
                      ? "scale-[1.9] cursor-zoom-out"
                      : "scale-100 cursor-zoom-in",
                )}
              >
                <Image
                  src={image.src}
                  width={image.width}
                  height={image.height}
                  alt={image.alt}
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  priority={i === 0}
                  className={clsx(
                    "h-full w-full",
                    image.onWhite
                      ? "cm-whiten cm-feather object-contain p-[7%]"
                      : "object-cover",
                  )}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="eyebrow pointer-events-none absolute bottom-4 left-5 text-ink-2!">
          Fig. {index + 1} / {images.length}
        </p>
        {images.length > 1 && (
          <div
            className="-translate-x-1/2 absolute bottom-5 left-1/2 flex gap-1.5 lg:hidden"
            aria-hidden
          >
            {images.map((image, i) => (
              <span
                key={image.src}
                className={clsx(
                  "h-1.5 rounded-full transition-all duration-500",
                  i === index
                    ? "w-5 bg-ink"
                    : "w-1.5 bg-[var(--c-line-strong)]",
                )}
              />
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-4 hidden gap-3 lg:flex">
          {images.map((image, i) => (
            <button
              key={image.src}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={clsx(
                "relative size-20 overflow-hidden rounded-[14px] bg-lime transition-[box-shadow,opacity] duration-500",
                i === index
                  ? "opacity-100 shadow-[inset_0_0_0_1.5px_var(--c-ink)]"
                  : "opacity-70 shadow-[inset_0_0_0_1px_var(--c-line)] hover:opacity-100",
              )}
            >
              <span
                className={clsx(
                  "absolute inset-0",
                  image.onWhite && "cm-multiply",
                )}
              >
                <Image
                  src={image.src}
                  width={image.width}
                  height={image.height}
                  alt=""
                  sizes="80px"
                  className={clsx(
                    "h-full w-full",
                    image.onWhite
                      ? "cm-whiten object-contain p-1.5"
                      : "object-cover",
                  )}
                />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
