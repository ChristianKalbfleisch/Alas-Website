"use client";

import Link from "next/link";
import { useState } from "react";
import { EmailForm } from "@/components/founding/email-form";
import {
  earnedTier,
  joinGift,
  openGift,
  useGift,
} from "@/components/founding/store";
import { Logo } from "@/components/ui/logo";
import { GIFT_START, GIFT_TOP } from "@/data/gift";
import { SHOPIFY_DOMAIN } from "@/data/products";

const CONTACT = "admin@alassaltco.com";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "Classic Pouch", href: "/products/classic-pouch" },
      { label: "Lemon Pouch", href: "/products/lemon-pouch" },
      { label: "Classic Sticks", href: "/products/sticks-15" },
      { label: "Lemon Sticks", href: "/products/lemon-sticks-15" },
      { label: "Discover Set", href: "/products/discover-set" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "How to use", href: "/#how-to-use" },
      { label: "Science & History", href: "/science-and-history" },
      { label: "Questions", href: "/#questions" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Wholesale", href: "/wholesale" },
      { label: "Contact", href: `mailto:${CONTACT}` },
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

/** The footer: the offer once more, every link, and the legal lines. */
export function Footer() {
  const gift = useGift();
  const [joined, setJoined] = useState(false);
  const member = joined || gift.joined;
  const earned = earnedTier(gift).percent;

  return (
    <footer className="bg-navy text-white">
      <div className="wrap py-[clamp(3.5rem,2.5rem+4vw,6rem)]">
        <div className="grid gap-12 wide:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] wide:gap-20">
          <div>
            <h2 className="t-h2 max-w-[18ch]">
              {member
                ? "Welcome, Founding Member."
                : `Up to ${GIFT_TOP.percent}% off your pre\u2011order.`}
            </h2>
            <p className="t-body mt-4 max-w-[30rem] text-white/75">
              {member
                ? `Your ${earned}% off is added at checkout. We will email you before your pre-order ships.`
                : `Join the Founding Members with your email for ${GIFT_START.percent}% off, then build it to ${GIFT_TOP.percent}% with a few quick answers.`}
            </p>
            {!member && (
              <EmailForm
                dark
                source="footer"
                label="Join"
                className="mt-6 max-w-[30rem]"
                onDone={() => {
                  joinGift();
                  setJoined(true);
                  // Straight on to the questions, where the discount grows.
                  openGift("footer");
                }}
              />
            )}
            {member && earned < GIFT_TOP.percent && (
              <button
                type="button"
                onClick={() => openGift("footer")}
                className="link t-body mt-5 font-bold text-white hover:text-foam!"
              >
                Build it to {GIFT_TOP.percent}%
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
