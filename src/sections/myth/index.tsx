"use client";

import Image from "next/image";
import { useRef } from "react";
import { RevealText } from "@/components/motion/reveal-text";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { MOMENTS, type Moment } from "./moments";
import "./myth-section.css";

/**
 * Myth and history: two museum plates in one editorial spread, then the
 * invitation. Text never scrubs: it reveals word by word once, and leaves with
 * the shared exit (fade, drift up, 98 %) as it passes the top of the screen.
 */
export default function MythSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          wide: "(min-width: 768px)",
          fine: "(pointer: fine)",
        },
        (ctx) => {
          const { motion, wide, fine } = ctx.conditions ?? {};
          const section = root.current;
          if (!motion || !section) return;
          const q = gsap.utils.selector(section);
          const drift = wide ? 5 : 3;

          // Plates open from a slight inset and settle from a zoom as they arrive.
          for (const plate of q("[data-plate]") as HTMLElement[]) {
            const img = plate.querySelector("[data-plate-img]");
            gsap.fromTo(
              plate,
              { clipPath: "inset(8% 6% 8% 6%)" },
              {
                clipPath: "inset(0% 0% 0% 0%)",
                ease: "power2.out",
                scrollTrigger: {
                  trigger: plate,
                  start: "top 95%",
                  end: "top 45%",
                  scrub: 0.3,
                },
              },
            );
            if (img) {
              gsap.fromTo(
                img,
                { scale: 1.16, yPercent: -drift },
                {
                  scale: 1.03,
                  yPercent: drift,
                  ease: "none",
                  scrollTrigger: {
                    trigger: plate,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 0.3,
                  },
                },
              );
            }
          }

          // Shared exit, images: fade, drift up and settle to 98 % through the top 15 %.
          for (const el of q("[data-exit-img]") as HTMLElement[]) {
            gsap.fromTo(
              el,
              { autoAlpha: 1, y: 0, scale: 1 },
              {
                autoAlpha: 0,
                y: -24,
                scale: 0.98,
                ease: "none",
                scrollTrigger: {
                  trigger: el,
                  start: "bottom 15%",
                  end: "bottom top",
                  scrub: 0.3,
                },
              },
            );
          }

          // Shared exit, text: the same move, played (never scrubbed) at the line.
          for (const el of q("[data-exit-text]") as HTMLElement[]) {
            const leave = gsap.to(el, {
              autoAlpha: 0,
              y: -24,
              scale: 0.98,
              duration: 0.5,
              ease: "power2.out",
              paused: true,
            });
            ScrollTrigger.create({
              trigger: el,
              start: "bottom 15%",
              onEnter: () => leave.play(),
              onLeaveBack: () => leave.reverse(),
            });
          }

          // Small copy rises in after its statement.
          for (const copy of q("[data-copy]") as HTMLElement[]) {
            gsap.from(copy.querySelectorAll("[data-rise]"), {
              y: 18,
              autoAlpha: 0,
              duration: 0.9,
              ease: "expo.out",
              stagger: 0.08,
              delay: 0.25,
              scrollTrigger: { trigger: copy, start: "top 82%", once: true },
            });
          }

          // Weight: plates lean a few pixels toward the pointer.
          if (!fine) return;
          const leaners = (q("[data-lean]") as HTMLElement[]).map((el) => ({
            k: Number(el.dataset.lean),
            x: gsap.quickTo(el, "x", { duration: 1.2, ease: "power3" }),
            y: gsap.quickTo(el, "y", { duration: 1.2, ease: "power3" }),
          }));
          const onMove = (e: PointerEvent) => {
            const nx = e.clientX / window.innerWidth - 0.5;
            const ny = e.clientY / window.innerHeight - 0.5;
            for (const l of leaners) {
              l.x(nx * l.k);
              l.y(ny * l.k);
            }
          };
          window.addEventListener("pointermove", onMove, { passive: true });
          return () => window.removeEventListener("pointermove", onMove);
        },
      );
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="myth"
      data-section="myth"
      aria-labelledby="myth-title"
      className="myth"
    >
      <div className="container-x">
        <p className="rule-label eyebrow">/ Myth and history</p>
        <h2 id="myth-title" className="sr-only">
          Two old stories about salt
        </h2>

        <ol className="myth-spread">
          {MOMENTS.map((m, i) => (
            <MomentCard key={m.key} moment={m} index={i} />
          ))}
        </ol>

        <div data-exit-text className="myth-close">
          <RevealText
            as="p"
            by="words"
            stagger={0.06}
            className="font-display myth-close-line"
          >
            Now it’s your turn to pass the salt.
          </RevealText>
        </div>
      </div>
    </section>
  );
}

function MomentCard({ moment: m, index }: { moment: Moment; index: number }) {
  return (
    <li className={`myth-moment myth-moment-${index + 1}`}>
      <div data-exit-img className="myth-visual">
        <div data-lean={index === 0 ? 8 : 12} className="myth-lean">
          <div data-plate className="myth-plate">
            <div data-plate-img className="myth-plate-img">
              <Image
                src={m.image.src}
                alt={m.image.alt}
                fill
                sizes={
                  index === 0
                    ? "(min-width: 768px) 46vw, 92vw"
                    : "(min-width: 768px) 32vw, 78vw"
                }
                quality={85}
                className="myth-plate-photo"
              />
            </div>
          </div>
        </div>
      </div>

      <div data-copy data-exit-text className="myth-copy">
        <p data-rise className="eyebrow myth-label">
          {m.label}
        </p>
        <RevealText
          as="h3"
          by="words"
          stagger={0.06}
          className="font-display myth-statement"
          start="top 88%"
        >
          {m.statement}
        </RevealText>
        {m.original && (
          <p data-rise className="myth-original">
            <span lang={m.original.lang} className="font-display">
              {m.original.text}
            </span>
            <span className="myth-gloss">{m.original.gloss}</span>
          </p>
        )}
        <p data-rise className="myth-line">
          {m.line}
        </p>
      </div>
    </li>
  );
}
