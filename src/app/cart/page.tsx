import { CartView } from "@/components/cart-view";

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold">Carrito</h1>
      <CartView />
    </main>
  );
}
