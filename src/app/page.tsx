import { ProductGrid } from "@/components/product-grid";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Productos
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Una selección de mi trabajo.
        </p>
      </header>
      <ProductGrid />
    </main>
  );
}
