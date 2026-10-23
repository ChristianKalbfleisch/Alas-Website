"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { addToCartAction, type AddToCartState } from "@/lib/cart/actions";
// Leaf imports, not the package barrel: the barrel re-exports the
// Storefront client, which is server-only and cannot cross into the browser.
import { formatMoney } from "@/lib/shopify/money";
import type { Money, SellingPlanGroup } from "@/lib/shopify/types";

import styles from "./add-to-cart.module.css";

const INITIAL: AddToCartState = { ok: false, message: null };

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={styles.submit}
      disabled={disabled || pending}
    >
      {pending ? "Adding…" : "Add to cart"}
    </button>
  );
}

export function AddToCart({
  variantId,
  price,
  available,
  sellingPlanGroups,
}: {
  variantId: string;
  price: Money;
  available: boolean;
  sellingPlanGroups: SellingPlanGroup[];
}) {
  const [state, formAction] = useActionState(addToCartAction, INITIAL);

  // Every plan across every group, flattened. In practice there is one group
  // (the Ritual) — but the shape allows more, so do not assume.
  const plans = sellingPlanGroups.flatMap((group) =>
    group.sellingPlans.map((plan) => ({ ...plan, groupName: group.name })),
  );

  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="merchandiseId" value={variantId} />

      {plans.length > 0 && (
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Purchase options</legend>

          <label className={styles.option}>
            <input
              type="radio"
              name="sellingPlanId"
              value=""
              defaultChecked
              className={styles.radio}
            />
            <span className={styles.optionBody}>
              <span className={styles.optionName}>One-time purchase</span>
              <span className={styles.optionPrice}>{formatMoney(price)}</span>
            </span>
          </label>

          {plans.map((plan) => (
            <label key={plan.id} className={styles.option}>
              <input
                type="radio"
                name="sellingPlanId"
                value={plan.id}
                className={styles.radio}
              />
              <span className={styles.optionBody}>
                <span className={styles.optionName}>{plan.name}</span>
                {/* Only shown when Shopify gives a real percentage. The
                    catalogue-wide "up to 20%" is a ceiling, not a per-plan
                    figure, so it is never substituted here. */}
                {plan.discountPercentage !== null && (
                  <span className={styles.optionSaving}>
                    Save {plan.discountPercentage}%
                  </span>
                )}
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <label className={styles.quantity}>
        <span className={styles.quantityLabel}>Quantity</span>
        <input
          type="number"
          name="quantity"
          defaultValue={1}
          min={1}
          max={20}
          inputMode="numeric"
          className={styles.quantityInput}
        />
      </label>

      <Submit disabled={!available} />

      {!available && (
        <p className={styles.note}>This one is sold out at the moment.</p>
      )}

      {/* Announced to screen readers as well as shown. */}
      <p
        className={state.ok ? styles.success : styles.error}
        role="status"
        aria-live="polite"
      >
        {state.message}
        {state.ok && (
          <a className={styles.cartLink} href="/cart">
            View cart
          </a>
        )}
      </p>
    </form>
  );
}
