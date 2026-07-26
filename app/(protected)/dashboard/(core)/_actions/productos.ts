"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, runWithAuditContext } from "@/utils/auth";
import { revalidatePath } from "next/cache";

export async function getProducts() {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  return prisma.products.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: { name: true, email: true },
      },
      productIngredients: {
        include: {
          ingredient: true,
        },
      },
    },
  });
}

export async function createProduct(data: {
  name: string;
  description: string;
  imageRoute?: string;
  price: number;
  ingredientIds: string[];
}) {
  const session = await requireRole(["SUPER_ADMIN", "ADMIN"]);

  if (!data.name.trim() || !data.description.trim()) {
    throw new Error("El nombre y la descripción son requeridos.");
  }
  if (data.price < 0) throw new Error("El precio no puede ser negativo.");

  const result = await runWithAuditContext(async () => {
    return prisma.products.create({
      data: {
        name: data.name.trim(),
        description: data.description.trim(),
        imageRoute: data.imageRoute ?? null,
        price: data.price,
        createdByUserId: session.user.id,
        productIngredients: {
          create: data.ingredientIds.map(id => ({ ingredientId: id })),
        },
      },
      include: {
        productIngredients: {
          include: { ingredient: true },
        },
      },
    });
  });

  revalidatePath("/dashboard/productos");
  return result;
}

export async function updateProduct(
  id: string,
  data: {
    name: string;
    description: string;
    imageRoute?: string;
    price: number;
    ingredientIds: string[];
  }
) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  if (!data.name.trim() || !data.description.trim()) {
    throw new Error("El nombre y la descripción son requeridos.");
  }
  if (data.price < 0) throw new Error("El precio no puede ser negativo.");

  const result = await runWithAuditContext(async () => {
    return prisma.products.update({
      where: { id },
      data: {
        name: data.name.trim(),
        description: data.description.trim(),
        imageRoute: data.imageRoute ?? null,
        price: data.price,
        productIngredients: {
          deleteMany: {},
          create: data.ingredientIds.map(id => ({ ingredientId: id })),
        },
      },
      include: {
        productIngredients: {
          include: { ingredient: true },
        },
      },
    });
  });

  revalidatePath("/dashboard/productos");
  return result;
}

export async function deleteProduct(id: string) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const result = await runWithAuditContext(async () => {
    return prisma.products.delete({ where: { id } });
  });

  revalidatePath("/dashboard/productos");
  return result;
}
