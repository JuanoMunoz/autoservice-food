"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, runWithAuditContext } from "@/utils/auth";
import { revalidatePath } from "next/cache";

export async function getConfiguration() {
    await requireRole(["SUPER_ADMIN", "ADMIN"]);

    return prisma.configuration.findMany({
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

export async function createConfiguration(data: { name: string; value: string }) {
    const session = await requireRole(["SUPER_ADMIN", "ADMIN"]);

    if (!data.name.trim() || !data.value.trim()) {
        throw new Error("El nombre y el valor son requeridos.");
    }

    const result = await runWithAuditContext(async () => {
        return prisma.configuration.create({
            data: {
                name: data.name.trim(),
                value: data.value.trim(),
                createdByUserId: session.user.id,
            },
        });
    });

    revalidatePath("/dashboard/configuracion");
    return result;
}

export async function updateConfiguration(id: string, data: { name: string; value: string }) {
    await requireRole(["SUPER_ADMIN", "ADMIN"]);

    if (!data.name.trim() || !data.value.trim()) {
        throw new Error("El nombre y el valor son requeridos.");
    }

    const result = await runWithAuditContext(async () => {
        return prisma.configuration.update({
            where: { id },
            data: {
                name: data.name.trim(),
                value: data.value.trim(),
            },
        });
    });

    revalidatePath("/dashboard/configuracion");
    return result;
}

export async function deleteConfiguration(id: string) {
    await requireRole(["SUPER_ADMIN", "ADMIN"]);

    const result = await runWithAuditContext(async () => {
        return prisma.configuration.delete({
            where: { id },
        });
    });

    revalidatePath("/dashboard/configuracion");
    return result;
}
