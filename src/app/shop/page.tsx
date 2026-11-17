import { redirect } from "next/navigation";

/** The shop lives on the home page. */
export default function ShopPage() {
  redirect("/#shop");
}
