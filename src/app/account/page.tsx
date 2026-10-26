import type { Metadata } from "next";
import Image from "next/image";
import { RevealText } from "@/components/motion/reveal-text";
import { Button } from "@/components/ui/button";
import { art } from "@/data/art";
import {
  grainsFor,
  grainsLabel,
  grainsValue,
  POINTS,
  POINTS_BACK_PERCENT,
  REWARD_LABEL,
} from "@/data/points";
import { ACCOUNT_URL, getProduct } from "@/data/products";
import { RITUAL } from "@/data/ritual";
import { formatPrice } from "@/lib/cart/cart-math";
import { Rise } from "@/sections/shop/rise";

export const metadata: Metadata = {
  title: "Your grains · ALAS Salt Co.",
  description:
    "Every order earns grains, our points. Spend them on your next order.",
};

const pouch = getProduct("mikro");

const STEPS = [
  {
    n: "01",
    title: "Order",
    line: `One ${POINTS.one} for every $1 you spend.`,
  },
  {
    n: "02",
    title: "Collect",
    line: "They gather under the email you check out with. No password.",
  },
  {
    n: "03",
    title: "Spend",
    line: `Every ${POINTS.rewardAt} ${POINTS.many} take ${REWARD_LABEL} off an order. That is ${POINTS_BACK_PERCENT}% back.`,
  },
] as const;

/** A visitor's grains: zero until the points backend is connected. */
const BALANCE = 0;

/**
 * Your ALAS: the grains balance, how grains work, and the door to orders.
 * Until points are live the balance is an honest zero and the page says so.
 */
export default function AccountPage() {
  const toFirst = Math.min(1, BALANCE / POINTS.rewardAt);
  return (
    <main className="bg-chalk pt-28 pb-[var(--section-y)] text-ink sm:pt-32">
      <div className="container-x">
        <Rise>
          <p className="rule-label eyebrow justify-between">
            <span>/ Your ALAS</span>
            <span className="text-ink-3!">
              {POINTS.live ? "Points" : "Points · opening soon"}
            </span>
          </p>
        </Rise>
        <div className="grid items-end gap-x-[var(--gutter)] lg:grid-cols-12">
          <div className="lg:col-span-7">
            <RevealText
              as="h1"
              start={null}
              className="font-display mt-8 text-[length:var(--fs-display)] leading-[0.92]"
            >
              Grains.
            </RevealText>
            <RevealText
              start={null}
              delay={0.15}
              className="font-display mt-5 max-w-[24ch] text-[length:var(--fs-h3)] text-ink-2"
            >
              Every order earns grains, our points. Spend them on your next one.
            </RevealText>
          </div>
          <Rise className="hidden lg:col-span-5 lg:block">
            <figure className="relative mt-8 aspect-[5/4] overflow-hidden rounded-[var(--r-lg)]">
              <Image
                src={art.photo.fleurMacro.src}
                alt={art.photo.fleurMacro.alt}
                fill
                sizes="(min-width: 1024px) 38vw, 1px"
                className="object-cover"
                priority
              />
              <figcaption className="eyebrow absolute bottom-4 left-5 text-ink!">
                / Fleur de sel, grain by grain
              </figcaption>
            </figure>
          </Rise>
        </div>

        <div className="mt-[clamp(3rem,2rem+4vw,6rem)] grid gap-x-[var(--gutter)] gap-y-14 lg:grid-cols-12">
          <Rise className="lg:col-span-7">
            <section
              aria-labelledby="balance-title"
              className="glass rounded-[28px] p-6 sm:p-10"
              style={{
                background:
                  "linear-gradient(180deg, rgb(255 255 255 / 0.85) 0%, rgb(255 255 255 / 0.66) 100%)",
              }}
            >
              <div className="flex items-start justify-between gap-6">
                <p id="balance-title" className="eyebrow">
                  / Your balance
                </p>
                {!POINTS.live && (
                  <span className="rounded-full bg-ink px-2.5 py-1.5 font-mono text-[9.5px] text-white uppercase leading-none tracking-[0.08em]">
                    Opening soon
                  </span>
                )}
              </div>
              <p className="mt-6 flex items-baseline gap-4">
                <span className="font-display text-[clamp(4.5rem,3rem+6vw,8.5rem)] leading-[0.85] tabular-nums">
                  {BALANCE}
                </span>
                <span className="font-display text-[1.6rem] text-ink-2">
                  {POINTS.many}
                </span>
              </p>
              <div className="mt-8">
                <div className="flex items-baseline justify-between font-mono text-[11px] text-ink-3 uppercase tracking-[0.08em]">
                  <span>
                    {grainsValue(BALANCE) > 0
                      ? `${formatPrice(grainsValue(BALANCE))} off to spend`
                      : "Your first reward"}
                  </span>
                  <span>
                    {POINTS.rewardAt} {POINTS.many} = {REWARD_LABEL} off
                  </span>
                </div>
                <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-[var(--c-line)]">
                  <div
                    className="h-full origin-left rounded-full bg-ink"
                    style={{ transform: `scaleX(${toFirst})` }}
                  />
                </div>
              </div>
              <p className="mt-8 max-w-[46ch] text-[15px] text-ink-2 leading-relaxed">
                {POINTS.live
                  ? "Signed in with the email you check out with, your grains show here and at checkout."
                  : "Grains open soon. From then on, every order adds to this balance, under the email you check out with. No account to create, no password."}
              </p>
              {pouch?.price != null && (
                <p className="mt-3 max-w-[46ch] text-[15px] text-ink-2 leading-relaxed">
                  A pouch of Mikró earns {grainsLabel(grainsFor(pouch.price))}.{" "}
                  {RITUAL.name} earns {grainsFor(RITUAL.price)} every month.
                </p>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button href="/#shop" size="lg" arrow>
                  Shop the range
                </Button>
                <Button href={ACCOUNT_URL} variant="ghost" size="lg">
                  My orders
                </Button>
              </div>
            </section>
          </Rise>

          <Rise className="lg:col-span-5 lg:pt-4" stagger={0.1}>
            <p className="rule-label eyebrow justify-between">
              <span>/ How grains work</span>
            </p>
            <ol className="mt-6">
              {STEPS.map((step) => (
                <li
                  key={step.n}
                  className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-4 border-[var(--c-line)] border-t py-5 last:border-b"
                >
                  <span className="pt-1 font-mono text-[11px] text-ink-3 tabular-nums">
                    {step.n}
                  </span>
                  <span>
                    <span className="font-display block text-[1.6rem] leading-none">
                      {step.title}
                    </span>
                    <span className="mt-2 block text-[15px] text-ink-2 leading-relaxed">
                      {step.line}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </Rise>
        </div>
      </div>

      <section
        aria-labelledby="sea-title"
        className="relative mt-[clamp(5rem,3rem+6vw,9rem)] overflow-hidden"
      >
        <div className="relative h-[72svh] min-h-[460px]">
          <Image
            src={art.photo.cove.src}
            alt={art.photo.cove.alt}
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,rgb(250_248_244_/_0.92)_0%,rgb(250_248_244_/_0.55)_38%,rgb(250_248_244_/_0)_70%)]"
          />
          <div className="container-x relative pt-[9svh]">
            <p className="eyebrow">/ Later · For the sea</p>
            <h2
              id="sea-title"
              className="font-display mt-4 max-w-[16ch] text-[length:var(--fs-h1)] leading-[0.98]"
            >
              Give your grains to the sea.
            </h2>
            <p className="mt-5 max-w-[42ch] text-[16px] text-ink-2 leading-relaxed">
              Soon you will be able to send grains to the people who protect
              Aegean sea life. Salt comes from the sea; some of it can go back.
            </p>
          </div>
        </div>
      </section>

      <div className="container-x mt-[clamp(4rem,3rem+4vw,7rem)]">
        <Rise className="grid gap-x-[var(--gutter)] gap-y-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="rule-label eyebrow justify-between">
              <span>/ Orders, addresses, subscriptions</span>
            </p>
          </div>
          <div className="lg:col-span-7">
            <p className="font-display text-[length:var(--fs-h3)] leading-[1.2]">
              They live with Shopify, behind a one-time code sent to your email.
            </p>
            <Button
              href={ACCOUNT_URL}
              variant="ghost"
              size="lg"
              className="mt-6"
            >
              Open my account
            </Button>
          </div>
        </Rise>
      </div>
    </main>
  );
}
