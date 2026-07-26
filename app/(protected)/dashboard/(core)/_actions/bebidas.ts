"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, runWithAuditContext } from "@/utils/auth";
import { revalidatePath } from "next/cache";

export async function getDrinks() {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  return prisma.drink.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: { name: true, email: true },
      },
    },
  });
}

export async function createDrink(data: {
  name: string;
  description: string;
  imageRoute?: string;
  price: number;
}) {
  const session = await requireRole(["SUPER_ADMIN", "ADMIN"]);

  if (!data.name.trim() || !data.description.trim()) {
    throw new Error("El nombre y la descripción son requeridos.");
  }
  if (data.price < 0) throw new Error("El precio no puede ser negativo.");

  const result = await runWithAuditContext(async () => {
    return prisma.drink.create({
      data: {
        name: data.name.trim(),
        description: data.description.trim(),
        imageRoute: data.imageRoute ?? null,
        price: data.price,
        createdByUserId: session.user.id,
      },
    });
  });

  revalidatePath("/dashboard/bebidas");
  return result;
}

export async function updateDrink(
  id: string,
  data: {
    name: string;
    description: string;
    imageRoute?: string;
    price: number;
  }
) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  if (!data.name.trim() || !data.description.trim()) {
    throw new Error("El nombre y la descripción son requeridos.");
  }
  if (data.price < 0) throw new Error("El precio no puede ser negativo.");

  const result = await runWithAuditContext(async () => {
    return prisma.drink.update({
      where: { id },
      data: {
        name: data.name.trim(),
        description: data.description.trim(),
        imageRoute: data.imageRoute ?? null,
        price: data.price,
      },
    });
  });

  revalidatePath("/dashboard/bebidas");
  return result;
}

export async function deleteDrink(id: string) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const result = await runWithAuditContext(async () => {
    return prisma.drink.delete({ where: { id } });
  });

  revalidatePath("/dashboard/bebidas");
  return result;
}
