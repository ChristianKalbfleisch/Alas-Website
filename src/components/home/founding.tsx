"use client";

import Image from "next/image";
import { Countdown } from "@/components/campaign/countdown";
import { useOffer } from "@/components/campaign/use-offer";
import { openGift, useGift } from "@/components/founding/store";
import { Button } from "@/components/ui/button";
import { Gift, Tag, Truck } from "@/components/ui/icons";
import type { OfferSteps } from "@/data/gift";
import { afterLine, ladderLine } from "@/data/offer-lines";
import { PHOTOS } from "@/data/photos";

const perks = (offer: OfferSteps) => [
  {
    icon: Tag,
    worth: `${offer.top.percent}%`,
    title: `Up to ${offer.top.percent}% off your pre-order`,
    line: [ladderLine(offer), afterLine(offer)].filter(Boolean).join(" "),
  },
  {
    icon: Gift,
    worth: "First",
    title: "Early access to the Welcome Box",
    line: "Founding Members get first access to the Welcome Box when it is ready.",
  },
  {
    icon: Truck,
    worth: "Always",
    title: "Better prices, for good",
    line: "Founding Members pay less than everyone else on later orders.",
  },
];

/**
 * The offer: every pre-order makes a Founding Member, and while a campaign is
 * on it pays more. It closes on the range photographed on a wet stone ledge by
 * the sea, whose sky runs up into the section's navy.
 */
export function Founding() {
  const claimed = useGift().joined;
  const offer = useOffer();
  const campaign = offer.campaign;
  return (
    <section
      id="offer"
      aria-labelledby="founding-title"
      className="overflow-clip bg-navy text-white"
    >
      <div className="wrap relative z-10 pt-[clamp(4rem,2.5rem+6vw,7.5rem)]">
        <div className="grid gap-10 wide:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] wide:gap-16">
          <div>
            <h2 id="founding-title" className="t-h2 max-w-[14ch]">
              {campaign
                ? `${campaign.name}, for Founding Members.`
                : "Pre‑order and become a Founding Member."}
            </h2>
            <p className="t-lead mt-5 max-w-[30rem] text-white/80">
              Everything ÁLAS sells today is a pre-order, and everyone who
              pre-orders is a Founding Member for good.
            </p>
            {campaign && (
              <div className="mt-8">
                <p className="t-small mb-2.5 text-white/70">
                  Ends {campaign.endsLabel}
                </p>
                <Countdown />
              </div>
            )}
            <Button
              tone="white"
              size="lg"
              arrow
              className="mt-8"
              onClick={() => openGift("founding")}
            >
              {claimed
                ? "See your code"
                : campaign
                  ? `Claim the ${campaign.name} price`
                  : "Become a Founding Member"}
            </Button>
          </div>
          <ul className="grid content-start">
            {perks(offer).map((perk) => (
              <li
                key={perk.title}
                className="flex items-start gap-4 border-white/15 border-t py-6 last:border-b"
              >
                <perk.icon size={28} className="mt-0.5 shrink-0 text-wave" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-[1.25rem] leading-tight font-bold">
                    {perk.title}
                  </h3>
                  <p className="t-body mt-1 text-white/80">{perk.line}</p>
                </div>
                <span
                  aria-hidden
                  className="t-price shrink-0 pl-2 text-[1.5rem] leading-tight tracking-[-0.02em] text-wave max-sm:hidden"
                >
                  {perk.worth}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <figure className="offer-photo">
        <Image
          src={PHOTOS.ledgeGlass.src}
          alt={PHOTOS.ledgeGlass.alt}
          placeholder="blur"
          sizes="(min-width: 50rem) 100vw, 250vw"
          style={{ objectPosition: "82% 100%" }}
        />
      </figure>
    </section>
  );
}
