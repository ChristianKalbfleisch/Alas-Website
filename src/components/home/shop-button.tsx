"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart/cart-context";

type ShopButtonProps = {
  children: ReactNode;
  /** Open the quick shop on one product. */
  focus?: string;
  tone?: "navy" | "white" | "outline" | "outline-white";
  size?: "sm" | "md" | "lg";
  arrow?: boolean;
  className?: string;
};

/** Opens the quick shop: every product one tap from checkout. */
export function ShopButton({ children, focus, ...rest }: ShopButtonProps) {
  const cart = useCart();
  return (
    <Button onClick={() => cart.openShop(focus)} {...rest}>
      {children}
    </Button>
  );
}
