"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listCategories } from "@/lib/categories";
import { createProduct, updateProduct } from "@/lib/products";
import type { Category, Product, ProductColor } from "@/types/product";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const COLOR_COUNT = 3;

type ColorSlot = ProductColor & { enabled: boolean };

function initialColors(product?: Product): ColorSlot[] {
  return Array.from({ length: COLOR_COUNT }, (_, i) => ({
    enabled: !!product?.colors[i],
    name: product?.colors[i]?.name ?? "",
    hex: product?.colors[i]?.hex ?? "#000000",
  }));
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const smallInputClass =
  "rounded-lg border border-black/20 bg-white/80 px-3 py-2 text-sm disabled:opacity-40";

const inputClass =
  "w-full rounded-lg border border-black/20 bg-white/80 px-3 py-2 text-sm";

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [amount, setAmount] = useState(product ? String(product.amount) : "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [colors, setColors] = useState<ColorSlot[]>(() =>
    initialColors(product),
  );
  const [image, setImage] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const preview = localPreview ?? product?.imageUrl ?? "";
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setError("No se pudieron cargar las categorías."));
  }, []);

  function updateColor(index: number, patch: Partial<ColorSlot>) {
    setColors((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  function onImageChange(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("La imagen debe pesar 5 MB o menos.");
      return;
    }
    setError(null);
    setImage(file);
    setLocalPreview(URL.createObjectURL(file));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const priceValue = Number(price);
    const amountValue = Number(amount);

    if (!name.trim() || !description.trim()) {
      return setError("El nombre y la descripción son obligatorios.");
    }
    if (price === "" || !Number.isFinite(priceValue) || priceValue < 0) {
      return setError("El precio debe ser un número mayor o igual a 0.");
    }
    if (amount === "" || !Number.isInteger(amountValue) || amountValue < 0) {
      return setError("La cantidad debe ser un número entero mayor o igual a 0.");
    }
    const category = categories?.find((c) => c.id === categoryId);
    if (!category) {
      return setError("Elige una categoría.");
    }
    for (let i = 0; i < colors.length; i++) {
      if (!colors[i].enabled) continue;
      if (!colors[i].name.trim()) {
        return setError(`El color ${i + 1} necesita un nombre.`);
      }
      if (!HEX_RE.test(colors[i].hex)) {
        return setError(`El color ${i + 1} necesita un código hex válido, como #1a2b3c.`);
      }
    }
    if (!product && !image) {
      return setError("La imagen es obligatoria.");
    }

    const input = {
      name: name.trim(),
      description: description.trim(),
      price: priceValue,
      amount: amountValue,
      categoryId: category.id,
      categoryName: category.name,
      colors: colors
        .filter((c) => c.enabled)
        .map((c) => ({ name: c.name.trim(), hex: c.hex.toLowerCase() })),
    };

    setSaving(true);
    try {
      if (product) {
        await updateProduct(product, input, image);
      } else if (image) {
        await createProduct(input, image);
      }
      router.push("/admin");
    } catch {
      setError("No se pudo guardar el producto. Inténtalo de nuevo.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Nombre
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Descripción
        <textarea
          className={inputClass}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Precio (USD)
          <input
            className={inputClass}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Cantidad
          <input
            className={inputClass}
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Categoría
        <select
          className={inputClass}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={!categories}
        >
          <option value="">
            {categories ? "Selecciona una categoría" : "Cargando..."}
          </option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {categories?.length === 0 && (
          <span className="text-xs font-normal text-neutral-500">
            Aún no hay categorías.{" "}
            <Link href="/admin/categories" className="underline">
              Crea una
            </Link>
            .
          </span>
        )}
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">
          Colores <span className="font-normal text-neutral-500">(marca para usar, hasta 3)</span>
        </legend>
        {colors.map((color, i) => (
          <div key={i} className="flex items-center gap-3">
            <input
              type="checkbox"
              aria-label={`Activar color ${i + 1}`}
              checked={color.enabled}
              onChange={(e) => updateColor(i, { enabled: e.target.checked })}
              className="h-4 w-4 shrink-0"
            />
            <input
              type="color"
              aria-label={`Selector del color ${i + 1}`}
              disabled={!color.enabled}
              value={HEX_RE.test(color.hex) ? color.hex : "#000000"}
              onChange={(e) => updateColor(i, { hex: e.target.value })}
              className="h-9 w-10 shrink-0 cursor-pointer rounded border border-black/20 bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            />
            <input
              aria-label={`Código hex del color ${i + 1}`}
              disabled={!color.enabled}
              className={`${smallInputClass} w-24 shrink-0 font-mono`}
              value={color.hex}
              maxLength={7}
              placeholder="#000000"
              onChange={(e) => updateColor(i, { hex: e.target.value.trim() })}
            />
            <input
              aria-label={`Nombre del color ${i + 1}`}
              disabled={!color.enabled}
              className={`${smallInputClass} min-w-0 flex-1`}
              value={color.name}
              maxLength={40}
              placeholder={`Nombre del color ${i + 1}`}
              onChange={(e) => updateColor(i, { name: e.target.value })}
            />
          </div>
        ))}
      </fieldset>

      <div className="flex flex-col gap-1.5 text-sm font-medium">
        Imagen
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
          className="text-sm font-normal"
        />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Vista previa"
            className="mt-2 h-48 w-48 rounded-lg object-cover"
          />
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "Guardando..." : product ? "Guardar cambios" : "Crear producto"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded-lg border border-black/20 px-5 py-2.5 text-sm font-medium"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
