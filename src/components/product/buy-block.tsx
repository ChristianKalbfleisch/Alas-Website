"use client";

import { useState } from "react";
import { EmailForm } from "@/components/founding/email-form";
import { joinGift } from "@/components/founding/store";
import { Button } from "@/components/ui/button";
import { Check } from "@/components/ui/icons";
import { canOrder, isPriced, type Product } from "@/data/products";
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
 * The one way to buy a product, and the same for every product: "Add to cart"
 * keeps the visitor shopping, "Pre-order now" goes straight to checkout. A
 * product the store's checkout cannot charge for yet goes into the cart all
 * the same, and "Pre-order now" opens the cart on it: the cart takes it as a
 * pre-order by email. The button never names a price: the price stands once,
 * above it. Only a product with no price yet is held with an email here.
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

  if (canOrder(product)) {
    const toCart = () => {
      cart.add(product.handle, { qty });
      cart.open();
    };
    return (
      <div className="grid gap-2.5">
        <Button size={size} full onClick={toCart}>
          Add to cart
        </Button>
        {buyNow &&
          (isPriced(product) ? (
            <Button
              size={size}
              tone="outline"
              full
              href={cart.buyNowUrl(product.handle, qty)}
              onClick={() => noteBought([product.handle])}
            >
              Pre-order now
            </Button>
          ) : (
            <Button size={size} tone="outline" full onClick={toCart}>
              Pre-order now
            </Button>
          ))}
      </div>
    );
  }

  if (reserved) {
    return (
      <p className="t-body flex items-start gap-2.5 rounded-xl bg-mist p-4">
        <Check size={22} className="mt-0.5 shrink-0 text-sea" strokeWidth={2} />
        <span>
          Noted. We will email you the moment {product.name} has its price, with
          your Founding Member price.
        </span>
      </p>
    );
  }

  if (asking) {
    return (
      <div>
        <EmailForm
          source={`${product.handle}-hold`}
          label="Tell me"
          onDone={() => {
            joinGift();
            setReserved(true);
          }}
        />
        <p className="t-small text-ink-2">
          No payment now. We email you when {product.name} has its price.
        </p>
      </div>
    );
  }

  return (
    <Button size={size} full onClick={() => setAsking(true)}>
      Tell me when it opens
    </Button>
  );
}
