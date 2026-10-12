export type ProductColor = {
  name: string;
  hex: string;
};

export type Category = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  amount: number;
  categoryId: string;
  categoryName: string;
  colors: ProductColor[];
  imageUrl: string;
  imagePath: string;
  createdAt: number;
};

export type ProductInput = Pick<
  Product,
  | "name"
  | "description"
  | "price"
  | "amount"
  | "categoryId"
  | "categoryName"
  | "colors"
>;
