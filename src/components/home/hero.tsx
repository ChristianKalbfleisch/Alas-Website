"use client";

import Image from "next/image";
import {
  type AnimationEvent,
  Fragment,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { DealFigure } from "@/components/campaign/deal";
import { useOffer } from "@/components/campaign/use-offer";
import { HERO_PLATE, HERO_SCENES, HERO_WHY } from "@/data/hero";
import { HERO_SEA } from "@/data/hero-sea";
import { getProduct } from "@/data/products";
import { HeroSea } from "./hero-sea";
import { ShopButton } from "./shop-button";

/** How long a scene stays before the next one takes its place. */
const DWELL_SECONDS = 7;
/** A sideways drag of a finger this long turns the scene. */
const SWIPE_PX = 44;

const COUNT = HERO_SCENES.length;

/**
 * A scene's headline. Given as several lines, it carries their number and the
 * length of the longest, which the stylesheet sizes it by on a wide screen.
 */
function Title({ lines, first }: { lines: readonly string[]; first: boolean }) {
  const Tag = first ? "h1" : "h2";
  const set = lines.length > 1;
  return (
    <Tag
      className="hero-title"
      data-lines={set ? lines.length : undefined}
      style={
        set
          ? ({
              "--title-chars": Math.max(...lines.map((line) => line.length)),
            } as React.CSSProperties)
          : undefined
      }
    >
      {lines.map((line, n) => (
        <Fragment key={line}>
          {n > 0 && " "}
          <span>{line}</span>
        </Fragment>
      ))}
    </Tag>
  );
}
/** How wide the photograph is drawn, for the browser to pick a file by. */
const SHOT_SIZES =
  "(min-width: 45rem) and (min-aspect-ratio: 5/4) max(100vw, 175svh), 240vw";

/**
 * The first screen: the packs on a stone ledge with the sea behind them, and
 * above them, in the evening sky, a headline and one button. It is a short
 * film of four scenes on the same ledge. Each has its own headline and they
 * change by themselves, by a tap on a tab, a swipe or the arrow keys. The
 * ledge, the sea and the sky never change: what stands on the ledge leaves,
 * and the next scene arrives in its place. The button stays where it is
 * throughout.
 */
export function Hero() {
  const [index, setIndex] = useState(0);
  /** The scene just left: it fades from the ledge as the next one arrives. */
  const [under, setUnder] = useState<number | null>(null);
  /** The empty ledge has loaded, so a scene can leave before the next is there. */
  const [plate, setPlate] = useState(false);
  /** The scenes turn by themselves: off until the page has loaded, and for a visitor who asks for less motion. */
  const [playing, setPlaying] = useState(false);
  /** Motion is allowed at all: the pause button is only offered when it is. */
  const [canPlay, setCanPlay] = useState(false);
  /** The other scenes' photographs are fetched only once the page has loaded. */
  const [warm, setWarm] = useState(false);
  /** A visitor has turned a scene, so later changes wait for the old words to leave. */
  const [turned, setTurned] = useState(false);
  /** Held while a finger or pointer is on the controls, or the screen is elsewhere. */
  const [held, setHeld] = useState(false);
  const [away, setAway] = useState(false);
  const root = useRef<HTMLElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const top = useOffer().top.percent;

  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const start = () => {
      setWarm(true);
      setCanPlay(!calm.matches);
      setPlaying(!calm.matches);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    const changed = () => {
      setCanPlay(!calm.matches);
      if (calm.matches) setPlaying(false);
    };
    calm.addEventListener("change", changed);
    return () => {
      window.removeEventListener("load", start);
      calm.removeEventListener("change", changed);
    };
  }, []);

  // It rests while it is off screen or the tab is in the background.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let inView = true;
    const update = () => setAway(!inView || document.hidden);
    const seen = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        update();
      },
      { threshold: 0.35 },
    );
    seen.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      seen.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  const go = (next: number) => {
    const to = ((next % COUNT) + COUNT) % COUNT;
    if (to === index) return;
    setTurned(true);
    setWarm(true);
    setUnder(index);
    setIndex(to);
  };

  const onFilled = (event: AnimationEvent<HTMLElement>) => {
    if (event.animationName === "hero-fill") go(index + 1);
  };

  const onKeys = (event: KeyboardEvent<HTMLElement>) => {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    go(index + step);
    const tabs =
      event.currentTarget.querySelectorAll<HTMLElement>("[data-tab]");
    tabs[(((index + step) % COUNT) + COUNT) % COUNT]?.focus();
  };

  const onDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse") return;
    drag.current = { x: event.clientX, y: event.clientY };
  };
  const onUp = (event: PointerEvent<HTMLElement>) => {
    const from = drag.current;
    drag.current = null;
    if (!from) return;
    const across = event.clientX - from.x;
    const down = event.clientY - from.y;
    if (
      Math.abs(across) < SWIPE_PX ||
      Math.abs(across) < Math.abs(down) * 1.5
    ) {
      return;
    }
    go(index + (across < 0 ? 1 : -1));
  };

  const scene = HERO_SCENES[index];

  return (
    <section
      ref={root}
      aria-roledescription="carousel"
      aria-label="ÁLAS in four scenes"
      className="hero"
      data-playing={playing}
      data-held={held || away}
      data-turned={turned}
      data-plate={plate}
      style={{ "--dwell": `${DWELL_SECONDS}s` } as React.CSSProperties}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={() => {
        drag.current = null;
      }}
    >
      <div className="hero-copy wrap">
        <div
          className="hero-words-stack"
          aria-live={playing ? "off" : "polite"}
        >
          {HERO_SCENES.map((each, i) => (
            // biome-ignore lint/a11y/useSemanticElements: a slide of a carousel, not a set of form fields
            <div
              key={each.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${COUNT}: ${each.tab}`}
              className="hero-words"
              data-on={i === index}
              inert={i !== index}
            >
              <Title lines={each.headline} first={i === 0} />
              <p className="hero-line">
                {each.line.map((sentence, n) => (
                  <Fragment key={sentence}>
                    {n > 0 && " "}
                    <span>{sentence}</span>
                  </Fragment>
                ))}
              </p>
            </div>
          ))}
        </div>
        <div className="hero-actions">
          <ShopButton tone="white" size="lg" arrow focus={scene.focus}>
            Pre-order for up to {top}% off
          </ShopButton>
          <div className="hero-prices">
            {HERO_SCENES.map((each, i) => {
              const price = getProduct(each.priced.handle)?.price ?? null;
              return price === null ? null : (
                <p
                  key={each.id}
                  className="hero-price t-price"
                  data-on={i === index}
                  aria-hidden={i !== index}
                >
                  {each.priced.as}{" "}
                  <DealFigure price={price} struck tone="white" />
                </p>
              );
            })}
          </div>
          <a href={HERO_WHY.href} className="hero-why">
            {HERO_WHY.label}
          </a>
        </div>
      </div>

      <div className="hero-stage">
        <div className="hero-shots">
          {HERO_SCENES.map((each, i) =>
            i === 0 || warm ? (
              <figure
                key={each.id}
                className="hero-shot"
                data-on={i === index}
                data-under={i === under && i !== index}
                data-sea={HERO_SEA.scenes.indexOf(each.id)}
                aria-hidden={i !== index}
              >
                <Image
                  src={each.photo}
                  alt={each.alt}
                  placeholder={i === 0 ? "blur" : "empty"}
                  priority={i === 0}
                  quality={85}
                  sizes={SHOT_SIZES}
                />
              </figure>
            ) : null,
          )}
          {warm && (
            <figure className="hero-plate" aria-hidden>
              <Image
                src={HERO_PLATE}
                alt=""
                quality={85}
                sizes={SHOT_SIZES}
                onLoad={() => setPlate(true)}
              />
            </figure>
          )}
          <HeroSea scene={HERO_SEA.scenes.indexOf(scene.id)} />
        </div>
      </div>

      <div className="hero-tabs">
        {/* biome-ignore lint/a11y/useSemanticElements: the carousel's controls, not a set of form fields */}
        <div
          className="hero-tabs-row wrap"
          role="group"
          aria-label="Scenes"
          onKeyDown={onKeys}
          onPointerEnter={() => setHeld(true)}
          onPointerLeave={() => setHeld(false)}
          onFocus={() => setHeld(true)}
          onBlur={() => setHeld(false)}
        >
          {HERO_SCENES.map((each, i) => (
            <button
              key={each.id}
              type="button"
              data-tab
              className="hero-tab"
              aria-current={i === index}
              onClick={() => go(i)}
            >
              <i
                aria-hidden
                onAnimationEnd={i === index ? onFilled : undefined}
              />
              {each.tab}
            </button>
          ))}
          {canPlay && (
            <button
              type="button"
              className="hero-pause"
              aria-label={playing ? "Pause the scenes" : "Play the scenes"}
              onClick={() => setPlaying((on) => !on)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                {playing ? (
                  <path d="M8 6v12M16 6v12" />
                ) : (
                  <path d="M8.5 6.2v11.6L18 12z" />
                )}
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
