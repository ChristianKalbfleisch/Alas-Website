"use client";

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { RevealText } from "@/components/motion/reveal-text";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { scrollToTarget } from "@/lib/motion/smooth-scroll";
import { Exit } from "@/sections/trust/exit";
import { Horizon } from "./horizon";
import {
  type FooterLink,
  SHOP_LINKS,
  STICK_LINKS,
  STORY_LINKS,
  SUPPORT_LINKS,
} from "./links";
import { Newsletter } from "./newsletter";
import { ShareLink } from "./share";

/** "/#id" scrolls smoothly when the target is on this page, else navigates home. */
function SmoothLink({
  href,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith("/#")) return;
    const id = href.slice(1);
    if (!document.querySelector(id)) return;
    event.preventDefault();
    scrollToTarget(id);
  };
  return (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  );
}

const linkClass =
  "font-display text-[1.2rem] leading-snug text-ink transition-[color,transform] duration-500 ease-[var(--ease-out)] hover:text-cobalt inline-block hover:translate-x-1";

function Column({
  title,
  links,
  children,
}: {
  title: string;
  links: FooterLink[];
  children?: ReactNode;
}) {
  return (
    <div>
      <h3 className="eyebrow text-ink-2">/ {title}</h3>
      <ul className="mt-5 grid gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <SmoothLink
              href={link.href}
              {...(link.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className={linkClass}
            >
              {link.label}
              {link.note && (
                <span className="eyebrow ml-2 align-middle text-ink-3">
                  {link.note}
                </span>
              )}
            </SmoothLink>
          </li>
        ))}
        {children}
      </ul>
    </div>
  );
}

/** 13 / Footer: a calm ledger on chalk, then the sea, where the journey began. */
export default function FooterSection() {
  return (
    <footer
      id="footer"
      data-section="footer"
      className="relative bg-chalk text-ink"
    >
      <div className="container-x pt-[var(--section-y)] pb-[clamp(4rem,9vh,7rem)]">
        <div className="rule-label justify-between">
          <p className="eyebrow">/ ALAS Salt Co.</p>
          <p className="eyebrow hidden sm:block">
            / The ritual, from the Aegean
          </p>
        </div>

        <div className="mt-14 grid gap-16 lg:mt-20 lg:grid-cols-12 lg:gap-x-6">
          <div className="lg:col-span-6 xl:col-span-5">
            <Exit>
              <Logo className="h-14 text-ink sm:h-16" />
              <RevealText
                as="h2"
                by="words"
                className="font-display mt-10 text-[length:clamp(2.6rem,1.6rem+3vw,4.6rem)] text-ink"
              >
                Join the table
              </RevealText>
              <p className="font-display mt-2 text-[length:clamp(1.35rem,1.1rem+0.9vw,1.9rem)] text-ink-2">
                10% off your next order.
              </p>
            </Exit>
            <Newsletter />
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button href="#shop" variant="solid">
                Shop ALAS
              </Button>
              <ShareLink />
            </div>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:col-span-6 lg:col-start-7 lg:pt-3"
          >
            <Column title="Shop" links={SHOP_LINKS.slice(0, 3)}>
              <li>
                <span className="font-display text-[1.2rem] leading-snug text-ink">
                  Hydration Sticks
                </span>
                <span className="mt-1 flex gap-3">
                  {STICK_LINKS.map((stick) => (
                    <a
                      key={stick.href}
                      href={stick.href}
                      aria-label={stick.aria}
                      className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.1em] grid h-8 min-w-8 place-items-center rounded-full px-2 text-ink ring-1 ring-[var(--c-line-strong)] ring-inset transition-colors duration-500 hover:bg-ink hover:text-white"
                    >
                      {stick.label}
                    </a>
                  ))}
                </span>
              </li>
              {SHOP_LINKS.slice(3).map((link) => (
                <li key={link.href}>
                  <SmoothLink href={link.href} className={linkClass}>
                    {link.label}
                    {link.note && (
                      <span className="eyebrow ml-2 align-middle text-ink-3">
                        {link.note}
                      </span>
                    )}
                  </SmoothLink>
                </li>
              ))}
            </Column>
            <Column title="Story" links={STORY_LINKS} />
            <Column title="Support" links={SUPPORT_LINKS} />
          </nav>
        </div>
      </div>

      <Horizon />
    </footer>
  );
}
