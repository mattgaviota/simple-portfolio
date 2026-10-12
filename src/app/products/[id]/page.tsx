import { Suspense } from "react";
import { ProductDetail } from "@/components/product-detail";

export default function ProductPage({ params }: PageProps<"/products/[id]">) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="grid gap-8 md:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-xl bg-white/60" />
            <div className="h-48 animate-pulse rounded-xl bg-white/60" />
          </div>
        }
      >
        <ProductDetail params={params} />
      </Suspense>
    </main>
  );
}
