"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, runWithAuditContext } from "@/utils/auth";
import { revalidatePath } from "next/cache";

export async function getSauces() {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  
  return prisma.sauce.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function createSauce(data: { name: string; hex: string }) {
  const session = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  
  if (!data.name.trim() || !data.hex.trim()) {
    throw new Error("El nombre y el color hexadecimal son requeridos.");
  }

  const result = await runWithAuditContext(async () => {
    return prisma.sauce.create({
      data: {
        name: data.name.trim(),
        hex: data.hex.trim(),
        createdByUserId: session.user.id,
      },
    });
  });

  revalidatePath("/dashboard/salsas");
  return result;
}

export async function updateSauce(id: string, data: { name: string; hex: string }) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  if (!data.name.trim() || !data.hex.trim()) {
    throw new Error("El nombre y el color hexadecimal son requeridos.");
  }

  const result = await runWithAuditContext(async () => {
    return prisma.sauce.update({
      where: { id },
      data: {
        name: data.name.trim(),
        hex: data.hex.trim(),
      },
    });
  });

  revalidatePath("/dashboard/salsas");
  return result;
}

export async function deleteSauce(id: string) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const result = await runWithAuditContext(async () => {
    return prisma.sauce.delete({
      where: { id },
    });
  });

  revalidatePath("/dashboard/salsas");
  return result;
}
