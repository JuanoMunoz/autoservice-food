import { IngredientType } from "@/lib/generated/prisma/client";

export interface Sauce {
  id: string;
  name: string;
  hex: string;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string | null;
  createdBy?: {
    name: string;
    email: string;
  } | null;
}

export interface Ingredient {
  id: string;
  name: string;
  description: string;
  imageRoute: string | null;
  price: { toNumber: () => number } | number;
  type: IngredientType;
  isTopping: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string | null;
  createdBy?: { name: string; email: string } | null;
}

export interface Drink {
  id: string;
  name: string;
  description: string;
  imageRoute: string | null;
  price: { toNumber: () => number } | number;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string | null;
  createdBy?: { name: string; email: string } | null;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  imageRoute: string | null;
  price: { toNumber: () => number } | number;
  productIngredients?: {
    ingredientId: string;
    ingredient: Ingredient;
  }[];
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string | null;
  createdBy?: { name: string; email: string } | null;
}

export interface Configuration {
  id: string;
  name: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string | null;
  createdBy?: { name: string; email: string } | null;
}
