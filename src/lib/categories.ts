import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { Category } from "@/types/product";

const COLLECTION = "categories";

export async function listCategories(): Promise<Category[]> {
  const snap = await getDocs(
    query(collection(getDb(), COLLECTION), orderBy("name")),
  );
  return snap.docs.map((d) => ({ id: d.id, name: String(d.data().name ?? "") }));
}

export async function createCategory(name: string) {
  await addDoc(collection(getDb(), COLLECTION), { name, createdAt: Date.now() });
}

export async function isCategoryInUse(id: string) {
  const snap = await getDocs(
    query(
      collection(getDb(), "products"),
      where("categoryId", "==", id),
      limit(1),
    ),
  );
  return !snap.empty;
}

export async function deleteCategory(id: string) {
  await deleteDoc(doc(getDb(), COLLECTION, id));
}
