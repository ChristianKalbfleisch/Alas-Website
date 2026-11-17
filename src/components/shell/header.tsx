"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bag, Close, Menu } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { useCart } from "@/lib/cart/cart-context";
import { NAV_LINKS } from "./nav-links";

/** The offer bar and the header together, in pixels: where the page's own content starts. */
const TOP_PX = 112;

/**
 * The header: logo, four links, the cart and one button. Solid, and always
 * there: the layout keeps it and the offer bar above it at the top of the page.
 * While the home page's first screen is under it, it wears that screen's navy,
 * so bar, header and photograph read as one.
 */
export function Header() {
  const cart = useCart();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [onHero, setOnHero] = useState(true);
  const dark = pathname === "/" && onHero && !menu;

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new page may bring a first screen of its own
  useEffect(() => {
    const hero = document.querySelector(".hero");
    if (!hero) return;
    const seen = new IntersectionObserver(
      ([entry]) => setOnHero(entry.isIntersecting),
      { rootMargin: `-${TOP_PX}px 0px 0px 0px` },
    );
    seen.observe(hero);
    return () => seen.disconnect();
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = menu ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [menu]);

  return (
    <header
      data-dark={dark}
      className={clsx(
        "relative border-b transition-colors duration-300",
        dark ? "border-white/10 bg-navy text-white" : "border-line bg-paper",
      )}
    >
      <div className="wrap flex h-[var(--header-h)] items-center gap-6">
        <Link
          href="/"
          aria-label="ALAS Salt Co., home"
          className={clsx("shrink-0", dark ? "text-white" : "text-navy")}
          onClick={() => setMenu(false)}
        >
          <Logo title="" className="h-11 w-auto" />
        </Link>

        <nav aria-label="Main" className="ml-4 hidden wide:block">
          <ul className="flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={clsx(
                    "text-[1.0625rem] transition-colors",
                    dark
                      ? "text-white/90 hover:text-white"
                      : "text-ink hover:text-sea",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={cart.open}
            aria-label={`Cart, ${cart.count} ${cart.count === 1 ? "item" : "items"}`}
            className={clsx(
              "relative grid size-11 place-items-center rounded-full",
              dark ? "text-white hover:bg-white/10" : "text-navy hover:bg-mist",
            )}
          >
            <Bag size={24} />
            {cart.count > 0 && (
              <span
                key={cart.addedAt}
                className={clsx(
                  "t-price absolute -top-0.5 -right-0.5 grid h-[1.375rem] min-w-[1.375rem] place-items-center rounded-full px-1 text-[0.8125rem] leading-none font-bold",
                  dark ? "bg-white text-navy" : "bg-navy text-white",
                )}
              >
                {cart.count}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => cart.openShop()}
            className={clsx(
              "btn btn-sm max-[22rem]:hidden",
              dark ? "btn-white" : "btn-navy",
            )}
          >
            Pre-order
          </button>
          <button
            type="button"
            onClick={() => setMenu((open) => !open)}
            aria-expanded={menu}
            aria-controls="site-menu"
            aria-label={menu ? "Close menu" : "Open menu"}
            className={clsx(
              "grid size-11 place-items-center rounded-full wide:hidden",
              dark ? "text-white hover:bg-white/10" : "text-navy hover:bg-mist",
            )}
          >
            {menu ? <Close size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div
        id="site-menu"
        hidden={!menu}
        className="absolute inset-x-0 top-full z-40 h-[calc(100dvh-var(--header-h)-var(--bar-h))] overflow-y-auto border-line border-t bg-paper wide:hidden"
      >
        <nav aria-label="Menu" className="wrap flex min-h-full flex-col py-6">
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href} className="border-line border-b">
                <Link
                  href={link.href}
                  onClick={() => setMenu(false)}
                  className="block py-5 text-[1.75rem] leading-tight tracking-[-0.02em] text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setMenu(false);
              cart.openShop();
            }}
            className="btn btn-navy btn-lg mt-8 w-full"
          >
            Pre-order now
          </button>
        </nav>
      </div>
    </header>
  );
}
