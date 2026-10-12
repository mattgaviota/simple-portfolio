"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartLine = {
  productId: string;
  colorName: string;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  count: number;
  ready: boolean;
  add: (line: CartLine) => void;
  setQuantity: (productId: string, colorName: string, quantity: number) => void;
  remove: (productId: string, colorName: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "cart";
const CartContext = createContext<CartState | null>(null);

const same = (a: CartLine, productId: string, colorName: string) =>
  a.productId === productId && a.colorName === colorName;

function load(): CartLine[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l) =>
        typeof l?.productId === "string" &&
        typeof l?.colorName === "string" &&
        Number.isInteger(l?.quantity) &&
        l.quantity > 0,
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // localStorage is only available on the client, so hydrate after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // storage unavailable; cart just won't persist
    }
  }, [lines, ready]);

  const add = useCallback((line: CartLine) => {
    setLines((prev) => {
      const existing = prev.find((l) => same(l, line.productId, line.colorName));
      return existing
        ? prev.map((l) =>
            l === existing ? { ...l, quantity: l.quantity + line.quantity } : l,
          )
        : [...prev, line];
    });
  }, []);

  const setQuantity = useCallback(
    (productId: string, colorName: string, quantity: number) =>
      setLines((prev) =>
        prev.map((l) => (same(l, productId, colorName) ? { ...l, quantity } : l)),
      ),
    [],
  );

  const remove = useCallback(
    (productId: string, colorName: string) =>
      setLines((prev) => prev.filter((l) => !same(l, productId, colorName))),
    [],
  );

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      ready,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [lines, ready, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
