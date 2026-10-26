import { ClubScene } from "./club-scene";

/**
 * 10 / The Ritual: the subscription, two pouches every month. Until its selling plan
 * is live in Shopify it is an invitation: founding members, one email field.
 * `data-gift-avoid` keeps the gift launcher away.
 */
export default function ClubSection() {
  return (
    <section
      id="club"
      data-section="club"
      data-gift-avoid
      className="relative overflow-x-clip bg-chalk py-[var(--section-y)] text-ink"
    >
      <ClubScene />
    </section>
  );
}
