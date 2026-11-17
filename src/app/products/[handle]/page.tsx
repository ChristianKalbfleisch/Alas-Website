import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Compare } from "@/components/home/compare";
import { Faq } from "@/components/home/faq";
import { HowTo } from "@/components/home/how-to";
import { ProductView } from "@/components/product/product-view";
import { getProduct, products } from "@/data/products";

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
      ? `${product.name}, ${product.sticks}`
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

/** Params are read inside Suspense so moving between products stays instant. */
export default function ProductPage({ params }: Props) {
  return (
    <main>
      <Suspense fallback={<div className="min-h-[70vh]" aria-busy="true" />}>
        <ProductContent params={params} />
      </Suspense>
      <HowTo />
      <Compare />
      <Faq />
    </main>
  );
}

async function ProductContent({ params }: Props) {
  const { handle } = await params;
  const product = getProduct(handle);
  if (!product) notFound();
  return <ProductView handle={product.handle} />;
}
