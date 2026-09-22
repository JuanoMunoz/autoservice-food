'use server'

import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { checkIsSuperAdmin, checkSession } from "@/utils/auth";
import { Role } from "@/lib/generated/prisma/enums";
import { redirect } from "next/navigation";
import { requireRole } from "@/utils/auth";
import { serializePrisma } from "@/utils/serializePrisma";
import { createOrder } from "@/app/(public)/order/actions";
import type { OrderDetails } from "@/types/Order";
import type { AdminOrderCatalog } from "@/types/AdminOrder";

export default async function registerAction(formdata: FormData) {
    const name = formdata.get("name") as string;
    const password = formdata.get("password") as string;
    const email = formdata.get("email") as string;

    if (!email || !password || !name) return { error: "Datos faltantes" };

    try {
        await auth.api.signUpEmail({
            body: { email, name, password },
            asResponse: true,
        });
    } catch (exception) {
        return { error: "Ocurrió un error al realizar el registro" };
    }
}

export async function getAllUsersAction() {
    const isSuperAdmin = await checkIsSuperAdmin();
    if (!isSuperAdmin) return { error: "No tienes permitido ver esto!" };

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
    });

    return { users };
}

export async function logoutAction() {
    const session = await checkSession();
    if (!session) return { error: "La sesión debe estar activa" };

    try {
        await auth.api.signOut({
            headers: await headers(),
        });
    } catch (exception) {
        return { error: "Ocurrió un error al cerrar sesión" };
    }

    redirect("/login");
}

export async function updateRoleAction(formdata: FormData) {
    const isSuperAdmin = await checkIsSuperAdmin();
    if (!isSuperAdmin) return { error: "No tienes permitido ver esto!" };

    const role = formdata.get("role") as Role;
    const email = formdata.get("email") as string;

    if (!email || !role) return { error: "Datos faltantes" };

    if (!Object.values(Role).includes(role)) {
        return { error: "Rol inválido" };
    }

    try {
        await prisma.user.update({
            where: { email },
            data: { role },
        });
    } catch (exception) {
        return { error: "Ocurrió un error al realizar la actualización" };
    }

    return { success: true };
}

export async function getDashboardOrderCatalog() {
    await requireRole(["SUPER_ADMIN", "ADMIN"]);

    const [products, drinks, sauces] = await Promise.all([
        prisma.products.findMany({
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                productIngredients: {
                    select: {
                        ingredient: {
                            select: { id: true, name: true, price: true, type: true, isTopping: true },
                        },
                    },
                },
            },
        }),
        prisma.drink.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true, description: true, price: true },
        }),
        prisma.sauce.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true, hex: true },
        }),
    ]);

    return serializePrisma({ products, drinks, sauces }) as unknown as AdminOrderCatalog;
}

export async function findLatestCustomerByPhone(phone: string) {
    await requireRole(["SUPER_ADMIN", "ADMIN"]);

    const normalizedPhone = phone.trim();
    if (!normalizedPhone) return null;

    const order = await prisma.order.findFirst({
        where: { buyerPhone: { contains: normalizedPhone } },
        orderBy: { createdAt: "desc" },
        select: {
            buyerName: true,
            buyerPhone: true,
            buyerEmail: true,
            address: true,
            onSite: true,
        },
    });

    return order ? serializePrisma(order) : null;
}

export async function createAdminOrder(details: OrderDetails) {
    await requireRole(["SUPER_ADMIN", "ADMIN"]);
    return createOrder(details);
}