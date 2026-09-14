"use server";

import { revalidatePath } from "next/cache";

import { addToSessionCart } from "./session";

export type AddToCartState = { ok: boolean; message: string | null };

/**
 * Server action behind the add-to-cart button.
 *
 * Returns a result rather than redirecting: the customer stays on the product
 * page, as they do on the current site. Checkout is reached from the cart, and
 * is Shopify's from that point on.
 */
export async function addToCartAction(
  _prev: AddToCartState,
  formData: FormData,
): Promise<AddToCartState> {
  const merchandiseId = String(formData.get("merchandiseId") ?? "");
  const sellingPlanId = String(formData.get("sellingPlanId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);

  if (!merchandiseId) {
    return { ok: false, message: "That product is missing a variant." };
  }

  try {
    await addToSessionCart([
      {
        merchandiseId,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        ...(sellingPlanId ? { sellingPlanId } : {}),
      },
    ]);
  } catch (error) {
    // The real reason goes to the server log; the customer gets something
    // they can act on.
    console.error("addToCartAction failed", error);
    return { ok: false, message: "We could not add that. Please try again." };
  }

  revalidatePath("/cart");
  return { ok: true, message: "Added to your cart." };
}
