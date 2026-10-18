import { IngredientType, MovementType } from "@/lib/generated/prisma/client";

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
  unit: string;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string | null;
  createdBy?: { name: string; email: string } | null;
}

export interface StockLocation {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

export interface InventoryRow {
  ingredientId: string;
  ingredientName: string;
  ingredientType: IngredientType;
  imageRoute: string | null;
  unit: string;
  locationId: string;
  locationName: string;
  locationCode: string;
  quantity: number;
  minQuantity: number;
}

export interface InventoryMovementRow {
  id: string;
  type: MovementType;
  quantity: number;
  reason: string | null;
  note: string | null;
  createdAt: string;
  ingredientName: string;
  unit: string;
  fromLocationName: string | null;
  toLocationName: string | null;
  userName: string | null;
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
