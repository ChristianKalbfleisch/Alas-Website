import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
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

export const metadata: Metadata = {
  title: "Your grains · ALAS Salt Co.",
  description:
    "Every order earns grains, our points. Spend them on your next order.",
};

const pouch = getProduct("classic-pouch");

const STEPS = [
  {
    title: "Order",
    line: `One ${POINTS.one} for every $1 you spend.`,
  },
  {
    title: "Collect",
    line: "They gather under the email you check out with. No password.",
  },
  {
    title: "Spend",
    line: `Every ${POINTS.rewardAt} ${POINTS.many} take ${REWARD_LABEL} off an order. That is ${POINTS_BACK_PERCENT}% back.`,
  },
];

/** A visitor's grains: zero until the points backend is connected. */
const BALANCE = 0;

/**
 * The points page: the balance, how grains work, and the door to orders.
 * Until points are live the balance is an honest zero and the page says so.
 */
export default function AccountPage() {
  const toFirst = Math.min(1, BALANCE / POINTS.rewardAt);
  return (
    <main>
      <header className="wrap pt-[clamp(2.5rem,1.5rem+4vw,5rem)]">
        <h1 className="t-display text-navy">Grains.</h1>
        <p className="t-lead mt-6 max-w-[28rem] text-ink-2">
          Every order earns grains, our points. Spend them on your next one.
        </p>
      </header>

      <div className="wrap section grid gap-x-20 gap-y-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section
          aria-labelledby="balance-title"
          className="rounded-[var(--radius-panel)] bg-navy p-7 text-white sm:p-10"
        >
          <div className="flex items-start justify-between gap-6">
            <h2 id="balance-title" className="text-[1.25rem] font-bold">
              Your balance
            </h2>
            {!POINTS.live && (
              <span className="t-small shrink-0 rounded-full bg-paper px-3.5 py-1.5 font-bold text-navy">
                Opening soon
              </span>
            )}
          </div>
          <p className="mt-8 flex items-baseline gap-4">
            <span className="t-price text-[clamp(4.5rem,3rem+6vw,7.5rem)] leading-[0.9] tracking-[-0.04em]">
              {BALANCE}
            </span>
            <span className="t-lead text-white/75">{POINTS.many}</span>
          </p>
          <div className="mt-8">
            <div className="t-small flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-white/75">
              <span>
                {grainsValue(BALANCE) > 0
                  ? `${formatPrice(grainsValue(BALANCE))} off to spend`
                  : "Your first reward"}
              </span>
              <span>
                {POINTS.rewardAt} {POINTS.many} = {REWARD_LABEL} off
              </span>
            </div>
            <div
              aria-hidden
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"
            >
              <div
                className="h-full origin-left rounded-full bg-wave"
                style={{ transform: `scaleX(${toFirst})` }}
              />
            </div>
          </div>
          <p className="t-body mt-8 max-w-[34rem] text-white/75">
            {POINTS.live
              ? "Signed in with the email you check out with, your grains show here and at checkout."
              : "Grains open soon. From then on, every order adds to this balance, under the email you check out with. No account to create, no password."}
          </p>
          {pouch?.price != null && (
            <p className="t-body mt-3 max-w-[34rem] text-white/75">
              A Classic Pouch earns {grainsLabel(grainsFor(pouch.price))}.{" "}
              {RITUAL.price === null
                ? `${RITUAL.name} earns grains with every delivery too.`
                : `${RITUAL.name} earns ${grainsFor(RITUAL.price)} with every delivery.`}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/#shop" tone="white" size="lg" arrow>
              Shop the range
            </Button>
            <Button href={ACCOUNT_URL} tone="outline-white" size="lg">
              My orders
            </Button>
          </div>
        </section>

        <section aria-labelledby="how-title" className="lg:pt-4">
          <h2 id="how-title" className="t-h2">
            How grains work.
          </h2>
          <ol className="mt-8">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="grid grid-cols-[2.75rem_1fr] gap-x-4 border-line border-t py-6 last:border-b"
              >
                <span
                  aria-hidden
                  className="t-price text-[1.375rem] leading-[1.3] text-sea"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="t-h3">{step.title}</h3>
                  <p className="t-body mt-1.5 text-ink-2">{step.line}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="wrap grid gap-5 pb-[clamp(4rem,2.5rem+6vw,7.5rem)] lg:grid-cols-2 lg:gap-6">
        <section
          aria-labelledby="sea-title"
          className="rounded-[var(--radius-panel)] bg-mist p-7 sm:p-10"
        >
          <h2 id="sea-title" className="t-h2 text-balance">
            Give your grains to the sea.
          </h2>
          <p className="t-body mt-4 max-w-[32rem] text-ink-2">
            One day you may be able to send grains to people who look after the
            sea. Salt comes from the sea; some of it can go back.
          </p>
        </section>
        <section
          aria-labelledby="orders-title"
          className="flex flex-col items-start rounded-[var(--radius-panel)] border border-line p-7 sm:p-10"
        >
          <h2 id="orders-title" className="t-h2 text-balance">
            Orders, addresses, subscriptions.
          </h2>
          <p className="t-body mt-4 max-w-[32rem] text-ink-2">
            They live with Shopify, behind a one-time code sent to your email.
          </p>
          <Button href={ACCOUNT_URL} tone="outline" size="lg" className="mt-8">
            Open my account
          </Button>
        </section>
      </div>
    </main>
  );
}
