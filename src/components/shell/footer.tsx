"use client";

import Link from "next/link";
import { EmailForm } from "@/components/founding/email-form";
import { NOT_SAVED } from "@/components/founding/signup";
import { joinGift, openGift } from "@/components/founding/store";
import { useMember } from "@/components/founding/use-member";
import { Logo } from "@/components/ui/logo";
import { CONTACT_EMAIL } from "@/data/faq";
import { joinLine } from "@/data/offer-lines";
import { SHOPIFY_DOMAIN } from "@/data/products";
import { WHY_TITLE } from "@/data/why-salt";
import { useShopper } from "@/lib/cart/shopper";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "Classic Pouch", href: "/products/classic-pouch" },
      { label: "Lemon Pouch", href: "/products/lemon-pouch" },
      { label: "Classic Sticks", href: "/products/sticks-15" },
      { label: "Lemon Sticks", href: "/products/lemon-sticks-15" },
      { label: "Discovery Set", href: "/products/discovery-set" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: WHY_TITLE, href: "/#why-salt" },
      { label: "How to use", href: "/#how-to-use" },
      { label: "Science & History", href: "/science-and-history" },
      { label: "Questions", href: "/#questions" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Wholesale", href: "/wholesale" },
      { label: "Contact", href: `mailto:${CONTACT_EMAIL}` },
      { label: "Instagram", href: "https://instagram.com/alassaltco" },
      {
        label: "Privacy policy",
        href: `https://${SHOPIFY_DOMAIN}/policies/privacy-policy`,
      },
    ],
  },
];

const FDA =
  "These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.";

/**
 * The footer: the offer once more, every link, and the legal lines. A member
 * is welcomed only once the store has kept their sign-up. A device that has
 * joined without that reads that nothing was saved, in place of the welcome,
 * and gets the form again with its address filled in.
 */
export function Footer() {
  const { offer, gift, earned: step } = useMember();
  const remembered = useShopper().email ?? "";
  const member = gift.joined && gift.saved;
  const unsaved = gift.joined && !gift.saved;
  const earned = step.percent;
  const top = offer.top.percent;

  return (
    <footer className="bg-navy text-white">
      <div className="wrap py-[clamp(3.5rem,2.5rem+4vw,6rem)]">
        <div className="grid gap-12 wide:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] wide:gap-20">
          <div>
            <h2 className="t-h2 max-w-[18ch]">
              {member
                ? "Welcome, Founding Member."
                : `Up to ${top}% off your pre\u2011order.`}
            </h2>
            <p
              data-not-saved={unsaved || undefined}
              className="t-body mt-4 max-w-[30rem] text-white/75"
            >
              {member
                ? `Your ${earned}% off is added at checkout. We will email you before your pre-order ships.`
                : unsaved
                  ? NOT_SAVED
                  : joinLine(offer)}
            </p>
            {!member && (
              <EmailForm
                // Filled in once the address this device remembers is read.
                key={remembered}
                dark
                source="footer"
                label="Join"
                initial={remembered}
                className="mt-6 max-w-[30rem]"
                onDone={() => {
                  joinGift();
                  // Straight on to the questions, where the discount grows.
                  openGift("footer");
                }}
              />
            )}
            {member && earned < top && (
              <button
                type="button"
                onClick={() => openGift("footer")}
                className="link t-body mt-5 font-bold text-white hover:text-foam!"
              >
                Build it to {top}%
              </button>
            )}
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-10 sm:grid-cols-3"
          >
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h3 className="text-[1.0625rem] font-bold">{column.title}</h3>
                <ul className="mt-4 grid gap-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("/") ? (
                        <Link
                          href={link.href}
                          className="text-[1.0625rem] text-white/75 transition-colors hover:text-white"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="text-[1.0625rem] text-white/75 transition-colors hover:text-white"
                          {...(link.href.startsWith("http")
                            ? { target: "_blank", rel: "noreferrer" }
                            : {})}
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-8 border-white/15 border-t pt-10 md:flex-row md:items-end md:justify-between">
          <Logo className="h-16 w-auto text-white" />
          <div className="max-w-[44rem] md:text-right">
            <p className="t-small text-white/75">
              © 2026 ALAS Salt Co. LLC · Casper, Wyoming · Sea salt from Greece,
              packed in California
            </p>
            <p className="t-fine mt-3 text-white/55">{FDA}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
