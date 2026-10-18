"use server";

import { prisma } from "@/lib/prisma";
import { Prisma, MovementType } from "@/lib/generated/prisma/client";
import { requireRole, runWithAuditContext } from "@/utils/auth";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/utils/serializePrisma";

const REVALIDATE = "/dashboard/inventario";

export async function getInventoryLocations() {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const locations = await prisma.stockLocation.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });

  return serializePrisma(locations);
}

export async function getInventoryOverview() {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const [locations, ingredients, stocks] = await Promise.all([
    prisma.stockLocation.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.ingredients.findMany({ orderBy: { name: "asc" } }),
    prisma.ingredientStock.findMany(),
  ]);

  const stockMap = new Map(
    stocks.map((s) => [`${s.ingredientId}:${s.locationId}`, s])
  );

  const rows = [];
  for (const ingredient of ingredients) {
    for (const location of locations) {
      const stock = stockMap.get(`${ingredient.id}:${location.id}`);
      rows.push({
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        ingredientType: ingredient.type,
        imageRoute: ingredient.imageRoute,
        unit: ingredient.unit,
        locationId: location.id,
        locationName: location.name,
        locationCode: location.code,
        quantity: Number(stock?.quantity ?? 0),
        minQuantity: Number(stock?.minQuantity ?? 0),
      });
    }
  }

  return serializePrisma({
    locations: locations.map((l) => ({ id: l.id, name: l.name, code: l.code, active: l.active })),
    rows,
  });
}

export async function registerEntry(data: {
  ingredientId: string;
  locationId: string;
  quantity: number;
  reason?: string;
  note?: string;
  type?: "PURCHASE" | "INITIAL";
}) {
  const session = await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const quantity = Number(data.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("La cantidad debe ser mayor a 0.");
  }

  const type: MovementType = data.type === "INITIAL" ? "INITIAL" : "PURCHASE";

  await runWithAuditContext(async () => {
    return prisma.$transaction(async (tx) => {
      await tx.ingredientStock.upsert({
        where: {
          ingredientId_locationId: {
            ingredientId: data.ingredientId,
            locationId: data.locationId,
          },
        },
        update: { quantity: { increment: quantity } },
        create: {
          ingredientId: data.ingredientId,
          locationId: data.locationId,
          quantity,
          minQuantity: 0,
        },
      });

      return tx.inventoryMovement.create({
        data: {
          ingredientId: data.ingredientId,
          type,
          toLocationId: data.locationId,
          quantity,
          reason: data.reason?.trim() || null,
          note: data.note?.trim() || null,
          userId: session.user.id,
        },
      });
    });
  });

  revalidatePath(REVALIDATE);
}

export async function transferStock(data: {
  ingredientId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  note?: string;
}) {
  const session = await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const quantity = Number(data.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("La cantidad debe ser mayor a 0.");
  }
  if (data.fromLocationId === data.toLocationId) {
    throw new Error("El origen y el destino deben ser diferentes.");
  }

  await runWithAuditContext(async () => {
    return prisma.$transaction(async (tx) => {
      const from = await tx.ingredientStock.findUnique({
        where: {
          ingredientId_locationId: {
            ingredientId: data.ingredientId,
            locationId: data.fromLocationId,
          },
        },
      });

      const available = Number(from?.quantity ?? 0);
      if (available < quantity) {
        throw new Error(`Stock insuficiente en el origen (disponible: ${available}).`);
      }

      await tx.ingredientStock.update({
        where: {
          ingredientId_locationId: {
            ingredientId: data.ingredientId,
            locationId: data.fromLocationId,
          },
        },
        data: { quantity: { decrement: quantity } },
      });

      await tx.ingredientStock.upsert({
        where: {
          ingredientId_locationId: {
            ingredientId: data.ingredientId,
            locationId: data.toLocationId,
          },
        },
        update: { quantity: { increment: quantity } },
        create: {
          ingredientId: data.ingredientId,
          locationId: data.toLocationId,
          quantity,
          minQuantity: 0,
        },
      });

      return tx.inventoryMovement.create({
        data: {
          ingredientId: data.ingredientId,
          type: "TRANSFER",
          fromLocationId: data.fromLocationId,
          toLocationId: data.toLocationId,
          quantity,
          note: data.note?.trim() || null,
          userId: session.user.id,
        },
      });
    });
  });

  revalidatePath(REVALIDATE);
}

export async function adjustStock(data: {
  ingredientId: string;
  locationId: string;
  newQuantity: number;
  reason?: string;
  note?: string;
  type?: "ADJUSTMENT" | "WASTE";
}) {
  const session = await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const newQuantity = Number(data.newQuantity);
  if (!Number.isFinite(newQuantity) || newQuantity < 0) {
    throw new Error("La cantidad no puede ser negativa.");
  }

  const type: MovementType = data.type === "WASTE" ? "WASTE" : "ADJUSTMENT";

  await runWithAuditContext(async () => {
    return prisma.$transaction(async (tx) => {
      const current = await tx.ingredientStock.findUnique({
        where: {
          ingredientId_locationId: {
            ingredientId: data.ingredientId,
            locationId: data.locationId,
          },
        },
      });

      const currentQty = Number(current?.quantity ?? 0);
      const delta = newQuantity - currentQty;
      if (delta === 0) {
        throw new Error("La cantidad es igual a la actual, no hay ajuste que registrar.");
      }

      await tx.ingredientStock.upsert({
        where: {
          ingredientId_locationId: {
            ingredientId: data.ingredientId,
            locationId: data.locationId,
          },
        },
        update: { quantity: newQuantity },
        create: {
          ingredientId: data.ingredientId,
          locationId: data.locationId,
          quantity: newQuantity,
          minQuantity: 0,
        },
      });

      return tx.inventoryMovement.create({
        data: {
          ingredientId: data.ingredientId,
          type,
          toLocationId: data.locationId,
          quantity: delta,
          reason: data.reason?.trim() || null,
          note: data.note?.trim() || null,
          userId: session.user.id,
        },
      });
    });
  });

  revalidatePath(REVALIDATE);
}

export async function setMinQuantity(data: {
  ingredientId: string;
  locationId: string;
  minQuantity: number;
}) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const minQuantity = Number(data.minQuantity);
  if (!Number.isFinite(minQuantity) || minQuantity < 0) {
    throw new Error("El mínimo no puede ser negativo.");
  }

  await runWithAuditContext(async () => {
    return prisma.ingredientStock.upsert({
      where: {
        ingredientId_locationId: {
          ingredientId: data.ingredientId,
          locationId: data.locationId,
        },
      },
      update: { minQuantity },
      create: {
        ingredientId: data.ingredientId,
        locationId: data.locationId,
        quantity: 0,
        minQuantity,
      },
    });
  });

  revalidatePath(REVALIDATE);
}

export async function getInventoryMovements(filters?: {
  ingredientId?: string;
  locationId?: string;
  type?: MovementType;
  limit?: number;
}) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const where: Prisma.InventoryMovementWhereInput = {};
  if (filters?.ingredientId) where.ingredientId = filters.ingredientId;
  if (filters?.type) where.type = filters.type;
  if (filters?.locationId) {
    where.OR = [
      { fromLocationId: filters.locationId },
      { toLocationId: filters.locationId },
    ];
  }

  const movements = await prisma.inventoryMovement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(filters?.limit ?? 100, 300),
    include: {
      ingredient: { select: { name: true, unit: true } },
      fromLocation: { select: { name: true } },
      toLocation: { select: { name: true } },
      user: { select: { name: true } },
    },
  });

  return serializePrisma(
    movements.map((m) => ({
      id: m.id,
      type: m.type,
      quantity: Number(m.quantity),
      reason: m.reason,
      note: m.note,
      createdAt: m.createdAt,
      ingredientName: m.ingredient.name,
      unit: m.ingredient.unit,
      fromLocationName: m.fromLocation?.name ?? null,
      toLocationName: m.toLocation?.name ?? null,
      userName: m.user?.name ?? null,
    }))
  );
}
