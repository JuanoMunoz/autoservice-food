"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, runWithAuditContext } from "@/utils/auth";
import { serializePrisma } from "@/utils/serializePrisma";
import { revalidatePath } from "next/cache";

export async function getTables() {
    await requireRole(["SUPER_ADMIN", "ADMIN"]);
    const tables = await prisma.table.findMany({
        orderBy: { number: "asc" },
        include: { _count: { select: { orders: true } } },
    });
    return serializePrisma(tables);
}

export async function createTable(data: { number: number; name?: string }) {
    await requireRole(["SUPER_ADMIN", "ADMIN"]);
    if (!Number.isInteger(data.number) || data.number < 1) {
        throw new Error("El número de mesa debe ser un entero positivo.");
    }

    const result = await runWithAuditContext(() => prisma.table.create({
        data: { number: data.number, name: data.name?.trim() || null },
        include: { _count: { select: { orders: true } } },
    }));
    revalidatePath("/dashboard/mesas");
    return serializePrisma(result);
}

export async function updateTable(id: string, data: { number: number; name?: string }) {
    await requireRole(["SUPER_ADMIN", "ADMIN"]);
    if (!Number.isInteger(data.number) || data.number < 1) {
        throw new Error("El número de mesa debe ser un entero positivo.");
    }

    const result = await runWithAuditContext(() => prisma.table.update({
        where: { id },
        data: { number: data.number, name: data.name?.trim() || null },
        include: { _count: { select: { orders: true } } },
    }));
    revalidatePath("/dashboard/mesas");
    return serializePrisma(result);
}

export async function toggleTable(id: string, active: boolean) {
    await requireRole(["SUPER_ADMIN", "ADMIN"]);
    const result = await runWithAuditContext(() => prisma.table.update({
        where: { id },
        data: { active },
        include: { _count: { select: { orders: true } } },
    }));
    revalidatePath("/dashboard/mesas");
    return serializePrisma(result);
}

export async function deleteTable(id: string) {
    await requireRole(["SUPER_ADMIN", "ADMIN"]);
    const table = await prisma.table.findUnique({
        where: { id },
        select: { _count: { select: { orders: true } } },
    });
    if (table?._count.orders) {
        throw new Error("No puedes borrar una mesa que tiene órdenes. Desactívala en su lugar.");
    }

    const result = await runWithAuditContext(() => prisma.table.delete({ where: { id } }));
    revalidatePath("/dashboard/mesas");
    return serializePrisma(result);
}
