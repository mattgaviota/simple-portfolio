"use client";

import { use, useEffect, useState } from "react";
import { ProductForm } from "@/components/product-form";
import { getProduct } from "@/lib/products";
import type { Product } from "@/types/product";

export function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null | undefined>();

  useEffect(() => {
    getProduct(id)
      .then(setProduct)
      .catch(() => setProduct(null));
  }, [id]);

  if (product === undefined) {
    return <p className="text-neutral-500">Cargando...</p>;
  }
  if (product === null) {
    return <p className="text-neutral-500">Producto no encontrado.</p>;
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Editar producto</h1>
      <ProductForm product={product} />
    </>
  );
}
