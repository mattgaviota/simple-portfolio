import { GalleryHeading } from "@/components/gallery-heading";
import { ProductGrid } from "@/components/product-grid";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <GalleryHeading />
      <ProductGrid />
    </main>
  );
}
