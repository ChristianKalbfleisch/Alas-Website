"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { type Flavour, getProduct } from "@/data/products";
import {
  buildCheckoutUrl,
  type CartLine,
  cartCount,
  cartSubtotal,
  formatPrice,
} from "./cart-math";

export type { CartLine };
export { buildCheckoutUrl, cartSubtotal, formatPrice };

type CartApi = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  /** Bumps on every add, so UI can pulse the cart icon. */
  addedAt: number;
  add: (handle: string, opts?: { qty?: number; flavour?: Flavour }) => void;
  setQty: (handle: string, flavour: Flavour | undefined, qty: number) => void;
  remove: (handle: string, flavour?: Flavour) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  checkoutUrl: string;
};

const STORAGE_KEY = "alas-cart-v1";
const MAX_QTY = 99;
const CartContext = createContext<CartApi | null>(null);

const sameLine = (a: CartLine, handle: string, flavour?: Flavour) =>
  a.handle === handle && a.flavour === flavour;

/** Only products with a current price can sit in the cart. */
const sellable = (handle: string) => {
  const product = getProduct(handle);
  return Boolean(product && product.price !== null);
};

/**
 * Saved carts from before flavours were paused may carry a flavour; flavours are
 * not in Shopify yet, so lines fold into one per product. Lines for products now
 * waiting on a new price are dropped.
 */
function sanitize(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const merged = new Map<string, number>();
  for (const l of raw) {
    if (
      typeof l?.handle !== "string" ||
      !sellable(l.handle) ||
      !Number.isInteger(l.qty) ||
      l.qty <= 0
    )
      continue;
    merged.set(
      l.handle,
      Math.min(MAX_QTY, (merged.get(l.handle) ?? 0) + l.qty),
    );
  }
  return [...merged].map(([handle, qty]) => ({ handle, qty }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [addedAt, setAddedAt] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setLines(sanitize(JSON.parse(saved)));
    } catch {
      // Storage unavailable (private mode): the cart still works in memory.
    }
    setHydrated(true);
    // "Return to cart" from Shopify checkout lands here with ?cart=open.
    const url = new URL(window.location.href);
    if (url.searchParams.get("cart") === "open") {
      url.searchParams.delete("cart");
      window.history.replaceState(window.history.state, "", url);
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Ignore: persistence is a convenience.
    }
  }, [lines, hydrated]);

  const add = useCallback<CartApi["add"]>((handle, opts) => {
    if (!sellable(handle)) return;
    const qty = opts?.qty ?? 1;
    const flavour = opts?.flavour;
    setLines((prev) => {
      const existing = prev.find((l) => sameLine(l, handle, flavour));
      if (existing) {
        return prev.map((l) =>
          sameLine(l, handle, flavour)
            ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) }
            : l,
        );
      }
      return [...prev, { handle, flavour, qty }];
    });
    setAddedAt(Date.now());
  }, []);

  const setQty = useCallback<CartApi["setQty"]>((handle, flavour, qty) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => !sameLine(l, handle, flavour))
        : prev.map((l) =>
            sameLine(l, handle, flavour)
              ? { ...l, qty: Math.min(MAX_QTY, qty) }
              : l,
          ),
    );
  }, []);

  const remove = useCallback<CartApi["remove"]>((handle, flavour) => {
    setLines((prev) => prev.filter((l) => !sameLine(l, handle, flavour)));
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartApi>(
    () => ({
      lines,
      count: cartCount(lines),
      subtotal: cartSubtotal(lines),
      isOpen,
      addedAt,
      add,
      setQty,
      remove,
      clear,
      open,
      close,
      checkoutUrl: buildCheckoutUrl(lines),
    }),
    [lines, isOpen, addedAt, add, setQty, remove, clear, open, close],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
