"use client";

import { useState } from "react";
import { EmailForm } from "@/components/founding/email-form";
import { joinGift } from "@/components/founding/store";
import { Button } from "@/components/ui/button";
import { Check } from "@/components/ui/icons";
import { isPriced, type Product } from "@/data/products";
import { useCart } from "@/lib/cart/cart-context";
import { noteBought } from "@/lib/cart/shopper";

type BuyBlockProps = {
  product: Product;
  qty?: number;
  size?: "md" | "lg";
  /** Also offer the link that skips the cart. */
  buyNow?: boolean;
};

/**
 * The one way to buy a product. A product that is in the store goes to the
 * cart; one that is not there yet is reserved with an email, with no payment.
 * The button never names a price: the price stands once, above it. "Add to
 * cart" keeps the visitor shopping; "Pre-order now" goes straight to checkout.
 */
export function BuyBlock({
  product,
  qty = 1,
  size = "md",
  buyNow = false,
}: BuyBlockProps) {
  const cart = useCart();
  const [asking, setAsking] = useState(false);
  const [reserved, setReserved] = useState(false);

  if (isPriced(product)) {
    return (
      <div className="grid gap-2.5">
        <Button
          size={size}
          full
          onClick={() => {
            cart.add(product.handle, { qty });
            cart.open();
          }}
        >
          Add to cart
        </Button>
        {buyNow && (
          <Button
            size={size}
            tone="outline"
            full
            href={cart.buyNowUrl(product.handle, qty)}
            onClick={() => noteBought([product.handle])}
          >
            Pre-order now
          </Button>
        )}
      </div>
    );
  }

  if (reserved) {
    return (
      <p className="t-body flex items-start gap-2.5 rounded-xl bg-mist p-4">
        <Check size={22} className="mt-0.5 shrink-0 text-sea" strokeWidth={2} />
        <span>
          Reserved. We will email you the moment {product.name} pre-orders open,
          with your Founding Member price.
        </span>
      </p>
    );
  }

  if (asking) {
    return (
      <div>
        <EmailForm
          source={`${product.handle}-hold`}
          label="Reserve"
          onDone={() => {
            joinGift();
            setReserved(true);
          }}
        />
        <p className="t-small text-ink-2">
          No payment now. We email you when {product.name} pre-orders open.
        </p>
      </div>
    );
  }

  return (
    <Button size={size} full onClick={() => setAsking(true)}>
      Reserve yours
    </Button>
  );
}
