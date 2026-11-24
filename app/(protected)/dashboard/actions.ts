'use server'

import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { checkIsSuperAdmin, checkSession } from "@/utils/auth";
import { Role } from "@/lib/generated/prisma/enums";
import { redirect } from "next/navigation";
import { requireRole } from "@/utils/auth";
import { serializePrisma } from "@/utils/serializePrisma";
import { createOrder, getOrderDetail, calculateDeliveryFee } from "@/app/(public)/order/actions";
import {
  calculateItemsSubtotal,
  sanitizeManualDeliveryFee,
  type CreateOrderOptions,
} from "@/app/(public)/order/order-shared";
import { resolvePaymentSplit } from "@/lib/payment-split";
import { Prisma } from "@/lib/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { runWithAuditContext } from "@/utils/auth";
import type { OrderDetails, OrderResponse } from "@/types/Order";
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
            addressReference: true,
            onSite: true,
        },
    });

    return order ? serializePrisma(order) : null;
}

export async function createAdminOrder(details: OrderDetails, opts?: CreateOrderOptions) {
    await requireRole(["SUPER_ADMIN", "ADMIN"]);
    return createOrder(details, opts);
}

/** Mesas activas para asignarlas desde el editor de pedidos del panel. */
export async function getActiveTablesForOrders() {
    await requireRole(["SUPER_ADMIN", "ADMIN"]);
    return prisma.table.findMany({
        where: { active: true },
        orderBy: { number: "asc" },
        select: { id: true, number: true, name: true },
    });
}

/** Busca pedidos (incluso completados/cancelados) por número, celular o nombre. */
export async function searchOrdersForEditing(query: string): Promise<OrderResponse[]> {
    await requireRole(["SUPER_ADMIN", "ADMIN"]);
    const q = query.trim();
    if (!q) return [];

    const numeric = /^\d+$/.test(q) ? Number(q) : null;
    const where: Prisma.OrderWhereInput = {
        OR: [
            { buyerPhone: { contains: q, mode: "insensitive" } },
            { buyerName: { contains: q, mode: "insensitive" } },
            ...(numeric !== null ? [{ orderNumber: numeric }] : []),
        ],
    };
    const found = await prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { id: true },
    });
    return Promise.all(found.map((o) => getOrderDetail(o.id)));
}

/**
 * Edición integral de un pedido (ítems, cliente, entrega, mesa, notas y pago).
 * El total se recalcula en servidor y el reparto efectivo/transferencia se
 * valida contra ese total. También se refreshea el snapshot de cada
 * delivery_log para que cuadres y domiciliarios usen siempre la misma data.
 */
export async function updateAdminOrder(
    orderId: number,
    details: OrderDetails,
    opts?: CreateOrderOptions
): Promise<OrderResponse> {
    await requireRole(["SUPER_ADMIN", "ADMIN"]);

    const existing = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true },
    });
    if (!existing) throw new Error("Pedido no encontrado.");

    if (details.tableId) {
        const table = await prisma.table.findFirst({
            where: { id: details.tableId, active: true },
            select: { id: true },
        });
        if (!table) throw new Error("Mesa no encontrada o inactiva.");
    }

    const itemsSubtotal = calculateItemsSubtotal(details.items);
    let deliveryFee = 0;
    if (details.location === "delivery") {
        const manualFee = sanitizeManualDeliveryFee(opts?.manualDeliveryFee);
        deliveryFee = manualFee !== undefined
            ? manualFee
            : (await calculateDeliveryFee(details.deliveryAddress?.coordinates)).fee;
    }

    const total = itemsSubtotal + deliveryFee;
    const payment = resolvePaymentSplit(
        details.paymentType,
        details.cashAmount,
        details.transferAmount,
        total
    );
    const onSite = details.location === "onSite";

    await runWithAuditContext(async () => {
        await prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: orderId },
                data: {
                    total: new Prisma.Decimal(total),
                    onSite,
                    address: details.deliveryAddress?.street || "",
                    addressReference: details.deliveryAddress?.reference?.trim() || null,
                    notes: details.notes?.slice(0, 300).trim() || null,
                    buyerName: details.buyerName,
                    buyerPhone: details.buyerPhone,
                    buyerEmail: details.buyerEmail || null,
                    tableId: onSite ? (details.tableId || null) : null,
                    paymentMethod: payment.method,
                    cashAmount: new Prisma.Decimal(payment.cashAmount),
                    transferAmount: new Prisma.Decimal(payment.transferAmount),
                    deliveryFee: new Prisma.Decimal(deliveryFee),
                    serveAtTable: onSite ? (details.serveAtTable ?? true) : null,
                },
            });

            // Reemplazo atómico de ítems: los nested extras/salsas se recrean juntos.
            await tx.orderItem.deleteMany({ where: { orderId } });
            for (const item of details.items) {
                await tx.orderItem.create({
                    data: {
                        orderId,
                        quantity: item.quantity || 1,
                        unitPrice: new Prisma.Decimal(item.price),
                        note: (item as { note?: string }).note?.slice(0, 140).trim() || null,
                        ...(item.type === "product"
                            ? { productId: ('productId' in item ? item.productId : undefined) || item.id }
                            : { drinkId: ('drinkId' in item ? item.drinkId : undefined) || item.id }),
                        ...("ingredients" in item && item.ingredients
                            ? {
                                extras: {
                                    create: item.ingredients.map((ing) => ({
                                        ingredientId: ing.id,
                                        quantity: ing.quantity || 1,
                                        unitPrice: new Prisma.Decimal(ing.price),
                                    })),
                                },
                            }
                            : {}),
                        ...("sauces" in item && item.sauces
                            ? {
                                sauces: {
                                    create: item.sauces.map((sauce) => ({ sauceId: sauce.id })),
                                },
                            }
                            : {}),
                    },
                });
            }

            await tx.deliveryLog.updateMany({
                where: { orderId },
                data: {
                    paymentMethod: payment.method,
                    cashAmount: new Prisma.Decimal(payment.cashAmount),
                    transferAmount: new Prisma.Decimal(payment.transferAmount),
                    orderTotal: new Prisma.Decimal(total),
                    driverEarning: onSite ? new Prisma.Decimal(0) : new Prisma.Decimal(deliveryFee),
                },
            });
        });
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/cuadres");
    revalidatePath("/dashboard/domiciliarios");
    revalidatePath(`/order/confirmation/${orderId}`);
    return getOrderDetail(orderId);
}