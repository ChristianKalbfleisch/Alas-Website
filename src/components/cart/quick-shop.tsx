"use client";

import { DealFigure, DealNote } from "@/components/campaign/deal";
import { useMember } from "@/components/founding/use-member";
import { Button } from "@/components/ui/button";
import {
  canOrder,
  getProduct,
  isPriced,
  type Product,
  products,
} from "@/data/products";
import { useCart } from "@/lib/cart/cart-context";
import { useShopper } from "@/lib/cart/shopper";
import { rankForShop } from "@/lib/cart/shopper-logic";
import { lineName } from "@/lib/signup/preorder";
import { Thumb } from "./cart-lines";

/** Every product, one tap from checkout; what this visitor looked at comes first. */
export function QuickShop() {
  const cart = useCart();
  const memory = useShopper();
  const { gift, mine } = useMember();
  const goal = gift.answers.goal;
  const ranked = rankForShop(
    products.map((p) => p.handle),
    memory,
    goal,
  )
    .map(getProduct)
    .filter((p): p is Product => Boolean(p));
  // The product a link asked for comes first, then everything with a price.
  const order = [
    ...ranked.filter((p) => p.handle === cart.focus),
    ...ranked.filter((p) => p.handle !== cart.focus && canOrder(p)),
    ...ranked.filter((p) => p.handle !== cart.focus && !canOrder(p)),
  ];

  return (
    <>
      <p className="border-line border-b pb-3">
        <DealNote source="quick-shop" />
      </p>
      <ul className="grid">
        {order.map((product) => (
          <li
            key={product.handle}
            data-quick-item={product.handle}
            className="flex items-center gap-4 border-line border-b py-4"
          >
            <Thumb product={product} />
            <div className="min-w-0 flex-1">
              <p className="text-[1.0625rem] leading-tight font-bold">
                {lineName(product)}
              </p>
              <p className="t-small t-price mt-0.5 text-ink-2">
                {product.price !== null && (
                  <DealFigure price={product.price} struck />
                )}
                {product.kind === "salt" && " · 390 g"}
                {product.kind === "sticks" && " · 2.5 g each"}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {canOrder(product) ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => cart.add(product.handle)}
                      aria-label={`Add ${lineName(product)} to cart`}
                    >
                      Add
                    </Button>
                    {/* Straight to checkout for a member; for anyone else
                        the cart, where the price they pay is plain. */}
                    {mine !== null && isPriced(product) ? (
                      <Button
                        size="sm"
                        tone="outline"
                        href={cart.buyNowUrl(product.handle)}
                        aria-label={`Pre-order ${lineName(product)} now, straight to checkout`}
                      >
                        Pre-order now
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        tone="outline"
                        onClick={() => cart.openWith(product.handle)}
                        aria-label={`Pre-order ${lineName(product)} now`}
                      >
                        Pre-order now
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    size="sm"
                    tone="outline"
                    href={`/products/${product.handle}`}
                    onClick={cart.close}
                  >
                    See it
                  </Button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
