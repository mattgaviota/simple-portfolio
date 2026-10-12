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
import type { Product, ProductColor, ProductInput } from "@/types/product";

const COLLECTION = "products";

function toColors(value: unknown): ProductColor[] {
  if (!Array.isArray(value)) return [];
  return value.map((c) => ({
    name: String(c?.name ?? ""),
    hex: String(c?.hex ?? "#000000"),
  }));
}

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

export async function createProduct(input: ProductInput, image: File) {
  const uploaded = await uploadImage(image);
  try {
    await addDoc(collection(getDb(), COLLECTION), {
      ...input,
      ...uploaded,
      createdAt: Date.now(),
    });
  } catch (error) {
    await removeImage(uploaded.imagePath);
    throw error;
  }
}

export async function updateProduct(
  product: Product,
  input: ProductInput,
  newImage: File | null,
) {
  const uploaded = newImage ? await uploadImage(newImage) : null;
  try {
    await updateDoc(doc(getDb(), COLLECTION, product.id), {
      ...input,
      ...(uploaded ?? {}),
    });
  } catch (error) {
    if (uploaded) await removeImage(uploaded.imagePath);
    throw error;
  }
  if (uploaded) await removeImage(product.imagePath);
}

export async function deleteProduct(product: Product) {
  await deleteDoc(doc(getDb(), COLLECTION, product.id));
  await removeImage(product.imagePath);
}
