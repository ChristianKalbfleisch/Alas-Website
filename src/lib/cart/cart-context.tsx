"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMember } from "@/components/founding/use-member";
import { type Flavour, getProduct } from "@/data/products";
import {
  buildCheckoutUrl,
  type CartLine,
  cartCount,
  cartSubtotal,
  formatPrice,
  MAX_QTY,
  savedCart,
  sellable,
} from "./cart-math";
import { useShopper } from "./shopper";

export type { CartLine };
export { buildCheckoutUrl, cartSubtotal, formatPrice };

type CartApi = {
  lines: CartLine[];
  count: number;
  /** What the store's checkout will charge for, before any discount. */
  subtotal: number;
  isOpen: boolean;
  /** Bumps on every add, so UI can pulse the cart icon. */
  addedAt: number;
  add: (handle: string, opts?: { qty?: number; flavour?: Flavour }) => void;
  setQty: (handle: string, flavour: Flavour | undefined, qty: number) => void;
  remove: (handle: string, flavour?: Flavour) => void;
  /**
   * Takes so many of a product out of the cart, and the line with them when
   * none are left. What was added in the meantime stays.
   */
  take: (handle: string, qty: number) => void;
  /** Opens the drawer on the cart. */
  open: () => void;
  /**
   * Opens the drawer on the cart with this product in it: it is put in, in the
   * amount given, only when it is not there yet.
   */
  openWith: (handle: string, qty?: number) => void;
  /** Opens the drawer on the quick shop, optionally on one product. */
  openShop: (focus?: string) => void;
  close: () => void;
  /** What the drawer shows: the cart, or the quick shop. */
  view: "cart" | "shop";
  /** The product the quick shop was opened on. */
  focus: string | null;
  checkoutUrl: string;
  /** Straight to checkout with just this product, skipping the cart. */
  buyNowUrl: (handle: string, qty?: number) => string;
  /** The code of the step a member holds under the offer in force; checkout links carry it. */
  discount: string | null;
};

/**
 * The name the cart is saved under on a device. A cart saved under an earlier
 * name is never read: it may hold products that are no longer sold.
 */
const STORAGE_KEY = "alas-cart-v2";
const CartContext = createContext<CartApi | null>(null);

const sameLine = (a: CartLine, handle: string, flavour?: Flavour) =>
  a.handle === handle && a.flavour === flavour;

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [addedAt, setAddedAt] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<"cart" | "shop">("cart");
  const [focus, setFocus] = useState<string | null>(null);
  const { code: discount, gift } = useMember();
  // The address a visitor left travels to checkout only once they have joined.
  const remembered = useShopper().email;
  const email = gift.joined ? remembered : null;
  const held = useRef(lines);
  held.current = lines;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setLines(savedCart(JSON.parse(saved)));
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
    // Ads and links can open the quick shop: ?shop=1, or ?shop=<product>.
    const shop = url.searchParams.get("shop");
    if (shop) {
      url.searchParams.delete("shop");
      window.history.replaceState(window.history.state, "", url);
      // Old and other names open on the product they lead to.
      setFocus(getProduct(shop)?.handle ?? null);
      setView("shop");
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

  const take = useCallback<CartApi["take"]>((handle, qty) => {
    setLines((prev) =>
      prev.flatMap((l) =>
        l.handle !== handle
          ? [l]
          : l.qty > qty
            ? [{ ...l, qty: l.qty - qty }]
            : [],
      ),
    );
  }, []);

  const open = useCallback(() => {
    setView("cart");
    setIsOpen(true);
  }, []);
  const openWith = useCallback<CartApi["openWith"]>(
    (handle, qty = 1) => {
      if (!held.current.some((line) => line.handle === handle)) {
        add(handle, { qty });
      }
      open();
    },
    [add, open],
  );
  const openShop = useCallback((handle?: string) => {
    setFocus((handle && getProduct(handle)?.handle) || null);
    setView("shop");
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

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
      take,
      open,
      openWith,
      openShop,
      close,
      view,
      focus,
      checkoutUrl: buildCheckoutUrl(lines, { discount, email }),
      buyNowUrl: (handle, qty = 1) =>
        buildCheckoutUrl([{ handle, qty }], { discount, email }),
      discount,
    }),
    [
      lines,
      isOpen,
      addedAt,
      add,
      setQty,
      remove,
      take,
      open,
      openWith,
      openShop,
      close,
      view,
      focus,
      discount,
      email,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
