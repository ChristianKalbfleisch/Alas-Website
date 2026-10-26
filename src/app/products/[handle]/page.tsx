import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProduct, products } from "@/data/products";
import { ProductView } from "./product-view";

type Props = { params: Promise<{ handle: string }> };

export function generateStaticParams() {
  return products.map((product) => ({ handle: product.handle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = getProduct(handle);
  if (!product) return {};
  const name =
    product.kind === "sticks"
      ? `${product.name}, ${product.subtitle}`
      : product.name;
  return {
    title: `${name} · ALAS Salt Co.`,
    description: product.description,
    openGraph: {
      title: `${name} · ALAS Salt Co.`,
      description: product.description,
      images: [{ url: product.images[0].src }],
    },
  };
}

/** Params are read inside Suspense so navigations between products stay instant. */
export default function ProductPage({ params }: Props) {
  return (
    <Suspense fallback={<ProductShell />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: Props) {
  const { handle } = await params;
  const product = getProduct(handle);
  if (!product) notFound();
  return <ProductView handle={product.handle} />;
}

/** Quiet placeholder with the page's own proportions, so nothing jumps. */
function ProductShell() {
  return (
    <main className="min-h-screen bg-chalk pt-28 sm:pt-32" aria-busy="true">
      <div className="container-x">
        <p className="rule-label eyebrow">The range</p>
        <div className="mt-8 grid gap-y-10 lg:mt-10 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
          <div className="aspect-square rounded-[var(--r-lg)] bg-lime lg:col-span-7" />
          <div className="space-y-5 lg:col-span-5">
            <div className="h-3 w-40 rounded-full bg-lime" />
            <div className="h-16 w-2/3 rounded-[var(--r-sm)] bg-lime" />
            <div className="h-16 w-full rounded-full bg-lime" />
          </div>
        </div>
      </div>
    </main>
  );
}
