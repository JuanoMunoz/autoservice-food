"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, runWithAuditContext } from "@/utils/auth";
import { revalidatePath } from "next/cache";
import { IngredientType } from "@/lib/generated/prisma/client";

export async function getIngredients() {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  return prisma.ingredients.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: { name: true, email: true },
      },
    },
  });
}

export async function createIngredient(data: {
  name: string;
  description: string;
  imageRoute?: string;
  price: number;
  type: IngredientType;
  isTopping: boolean;
}) {
  const session = await requireRole(["SUPER_ADMIN", "ADMIN"]);

  if (!data.name.trim() || !data.description.trim()) {
    throw new Error("El nombre y la descripción son requeridos.");
  }
  if (data.price < 0) throw new Error("El precio no puede ser negativo.");

  const result = await runWithAuditContext(async () => {
    return prisma.ingredients.create({
      data: {
        name: data.name.trim(),
        description: data.description.trim(),
        imageRoute: data.imageRoute ?? null,
        price: data.price,
        type: data.type,
        isTopping: data.isTopping,
        createdByUserId: session.user.id,
      },
    });
  });

  revalidatePath("/dashboard/ingredientes");
  return result;
}

export async function updateIngredient(
  id: string,
  data: {
    name: string;
    description: string;
    imageRoute?: string;
    price: number;
    type: IngredientType;
    isTopping: boolean;
  }
) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  if (!data.name.trim() || !data.description.trim()) {
    throw new Error("El nombre y la descripción son requeridos.");
  }
  if (data.price < 0) throw new Error("El precio no puede ser negativo.");

  const result = await runWithAuditContext(async () => {
    return prisma.ingredients.update({
      where: { id },
      data: {
        name: data.name.trim(),
        description: data.description.trim(),
        imageRoute: data.imageRoute ?? null,
        price: data.price,
        type: data.type,
        isTopping: data.isTopping,
      },
    });
  });

  revalidatePath("/dashboard/ingredientes");
  return result;
}

export async function deleteIngredient(id: string) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const result = await runWithAuditContext(async () => {
    return prisma.ingredients.delete({ where: { id } });
  });

  revalidatePath("/dashboard/ingredientes");
  return result;
}
