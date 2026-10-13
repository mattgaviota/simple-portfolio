import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { getDb, getStorageClient } from "@/lib/firebase";
import {
  MAX_EXTRA_IMAGES,
  type Product,
  type ProductColor,
  type ProductImage,
  type ProductInput,
} from "@/types/product";

const COLLECTION = "products";

function toColors(value: unknown): ProductColor[] {
  if (!Array.isArray(value)) return [];
  return value.map((c) => ({
    name: String(c?.name ?? ""),
    hex: String(c?.hex ?? "#000000"),
  }));
}

function toExtraImages(value: unknown): ProductImage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((i) => ({ url: String(i?.url ?? ""), path: String(i?.path ?? "") }))
    .filter((i) => i.url)
    .slice(0, MAX_EXTRA_IMAGES);
}

/** Change requested for one extra image slot when saving a product. */
export type ExtraSlot = { file: File | null; remove: boolean };

function toProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    price: Number(data.price ?? 0),
    amount: Number(data.amount ?? 0),
    categoryId: String(data.categoryId ?? ""),
    categoryName: String(data.categoryName ?? ""),
    colors: toColors(data.colors),
    imageUrl: String(data.imageUrl ?? ""),
    imagePath: String(data.imagePath ?? ""),
    extraImages: toExtraImages(data.extraImages),
    createdAt: Number(data.createdAt ?? 0),
  };
}

export async function uploadImage(file: File, folder = "products") {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const imagePath = `${folder}/${crypto.randomUUID()}-${safeName}`;
  const imageRef = ref(getStorageClient(), imagePath);
  await uploadBytes(imageRef, file, { contentType: file.type });
  const imageUrl = await getDownloadURL(imageRef);
  return { imageUrl, imagePath };
}

export async function removeImage(imagePath: string) {
  if (!imagePath) return;
  try {
    await deleteObject(ref(getStorageClient(), imagePath));
  } catch {
    // image already gone; nothing to clean up
  }
}

export async function listProducts(): Promise<Product[]> {
  const snap = await getDocs(
    query(collection(getDb(), COLLECTION), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => toProduct(d.id, d.data()));
}

export async function getProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(getDb(), COLLECTION, id));
  return snap.exists() ? toProduct(snap.id, snap.data()) : null;
}

export async function createProduct(
  input: ProductInput,
  image: File,
  extras: (File | null)[] = [],
) {
  const uploadedPaths: string[] = [];
  try {
    const main = await uploadImage(image);
    uploadedPaths.push(main.imagePath);
    const extraImages: ProductImage[] = [];
    for (const file of extras.slice(0, MAX_EXTRA_IMAGES)) {
      if (!file) continue;
      const up = await uploadImage(file);
      uploadedPaths.push(up.imagePath);
      extraImages.push({ url: up.imageUrl, path: up.imagePath });
    }
    await addDoc(collection(getDb(), COLLECTION), {
      ...input,
      ...main,
      extraImages,
      createdAt: Date.now(),
    });
  } catch (error) {
    await Promise.all(uploadedPaths.map(removeImage));
    throw error;
  }
}

export async function updateProduct(
  product: Product,
  input: ProductInput,
  newImage: File | null,
  slots: ExtraSlot[] = [],
) {
  const uploadedPaths: string[] = [];
  const staleExtraPaths: string[] = [];
  try {
    const uploaded = newImage ? await uploadImage(newImage) : null;
    if (uploaded) uploadedPaths.push(uploaded.imagePath);

    const extraImages: ProductImage[] = [];
    for (let i = 0; i < MAX_EXTRA_IMAGES; i++) {
      const current = product.extraImages[i];
      const slot = slots[i];
      if (slot?.file) {
        const up = await uploadImage(slot.file);
        uploadedPaths.push(up.imagePath);
        extraImages.push({ url: up.imageUrl, path: up.imagePath });
        if (current) staleExtraPaths.push(current.path);
      } else if (slot?.remove) {
        if (current) staleExtraPaths.push(current.path);
      } else if (current) {
        extraImages.push(current);
      }
    }

    await updateDoc(doc(getDb(), COLLECTION, product.id), {
      ...input,
      ...(uploaded ?? {}),
      extraImages,
    });
  } catch (error) {
    await Promise.all(uploadedPaths.map(removeImage));
    throw error;
  }
  if (newImage) await removeImage(product.imagePath);
  await Promise.all(staleExtraPaths.map(removeImage));
}

export async function deleteProduct(product: Product) {
  await deleteDoc(doc(getDb(), COLLECTION, product.id));
  await Promise.all(
    [product.imagePath, ...product.extraImages.map((i) => i.path)].map(removeImage),
  );
}
