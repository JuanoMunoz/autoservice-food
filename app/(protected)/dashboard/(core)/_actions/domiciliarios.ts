"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, runWithAuditContext } from "@/utils/auth";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/utils/serializePrisma";

export interface CreateDriverInput {
  name: string;
  phone?: string;
  vehicle?: string;
  licensePlate?: string;
}

export interface UpdateDriverInput {
  name?: string;
  phone?: string;
  vehicle?: string;
  licensePlate?: string;
  active?: boolean;
}

export async function getDeliveryDrivers() {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const drivers = await prisma.deliveryDriver.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      deliveries: {
        select: {
          id: true,
          orderTotal: true,
          createdAt: true,
        },
      },
    },
  });

  const formattedDrivers = drivers.map((driver) => {
    const totalDeliveries = driver.deliveries.length;
    const totalAmount = driver.deliveries.reduce((acc, curr) => acc + Number(curr.orderTotal), 0);
    const lastDelivery = driver.deliveries.length > 0
      ? driver.deliveries.reduce((latest, curr) => curr.createdAt > latest ? curr.createdAt : latest, driver.deliveries[0].createdAt).toISOString()
      : null;

    return {
      ...driver,
      totalDeliveries,
      totalAmount,
      lastDelivery,
    };
  });

  return serializePrisma(formattedDrivers);
}

export async function getActiveDeliveryDrivers() {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const drivers = await prisma.deliveryDriver.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return serializePrisma(drivers);
}

export async function createDeliveryDriver(data: CreateDriverInput) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  if (!data.name.trim()) {
    throw new Error("El nombre del domiciliario es obligatorio.");
  }

  const result = await runWithAuditContext(async () => {
    return prisma.deliveryDriver.create({
      data: {
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        vehicle: data.vehicle?.trim() || null,
        licensePlate: data.licensePlate?.trim() || null,
        active: true,
      },
    });
  });

  revalidatePath("/dashboard/domiciliarios");
  return serializePrisma(result);
}

export async function updateDeliveryDriver(id: string, data: UpdateDriverInput) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const existing = await prisma.deliveryDriver.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("El domiciliario no existe.");
  }

  const result = await runWithAuditContext(async () => {
    return prisma.deliveryDriver.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.phone !== undefined && { phone: data.phone.trim() || null }),
        ...(data.vehicle !== undefined && { vehicle: data.vehicle.trim() || null }),
        ...(data.licensePlate !== undefined && { licensePlate: data.licensePlate.trim() || null }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });
  });

  revalidatePath("/dashboard/domiciliarios");
  return serializePrisma(result);
}

export async function deleteDeliveryDriver(id: string) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const result = await runWithAuditContext(async () => {
    return prisma.deliveryDriver.delete({
      where: { id },
    });
  });

  revalidatePath("/dashboard/domiciliarios");
  return serializePrisma(result);
}

export async function toggleDeliveryDriverStatus(id: string) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const existing = await prisma.deliveryDriver.findUnique({ where: { id } });
  if (!existing) throw new Error("Domiciliario no encontrado.");

  const result = await runWithAuditContext(async () => {
    return prisma.deliveryDriver.update({
      where: { id },
      data: { active: !existing.active },
    });
  });

  revalidatePath("/dashboard/domiciliarios");
  return serializePrisma(result);
}

export async function completeOrderWithDriver(
  orderId: number,
  driverId?: string | null,
  notes?: string
) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Pedido no encontrado.");
  }

  // Update order status to COMPLETED
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: "COMPLETED" },
  });

  // If driver assigned, create delivery log
  if (driverId) {
    const driver = await prisma.deliveryDriver.findUnique({ where: { id: driverId } });
    if (driver) {
      await prisma.deliveryLog.create({
        data: {
          orderId,
          driverId,
          orderTotal: order.total,
          notes: notes?.trim() || null,
        },
      });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/domiciliarios");
  return serializePrisma(updatedOrder);
}

export async function getDeliveryLogs(driverId?: string, limit = 50) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const logs = await prisma.deliveryLog.findMany({
    where: driverId ? { driverId } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      driver: true,
      order: {
        select: {
          id: true,
          buyerName: true,
          buyerPhone: true,
          address: true,
          onSite: true,
          total: true,
          createdAt: true,
        },
      },
    },
  });

  const formattedLogs = logs.map((log) => ({
    ...log,
    orderTotal: Number(log.orderTotal),
    order: {
      ...log.order,
      total: Number(log.order.total),
    },
  }));

  return serializePrisma(formattedLogs);
}

export async function getDomiciliariosKPIs() {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const drivers = await prisma.deliveryDriver.findMany({
    include: {
      deliveries: {
        include: {
          order: {
            select: {
              id: true,
              total: true,
              buyerName: true,
              address: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const totalDeliveriesGlobal = drivers.reduce(
    (acc, d) => acc + d.deliveries.length,
    0
  );

  const totalAmountGlobal = drivers.reduce(
    (acc, d) => acc + d.deliveries.reduce((sum, del) => sum + Number(del.orderTotal), 0),
    0
  );

  const driverStats = drivers.map((d) => {
    const trips = d.deliveries.length;
    const totalMoney = d.deliveries.reduce((sum, del) => sum + Number(del.orderTotal), 0);
    const avgMoney = trips > 0 ? totalMoney / trips : 0;
    const lastDelivery = d.deliveries.length > 0 ? d.deliveries[0].createdAt : null;

    return {
      id: d.id,
      name: d.name,
      phone: d.phone,
      vehicle: d.vehicle,
      licensePlate: d.licensePlate,
      active: d.active,
      trips,
      totalMoney,
      avgMoney,
      lastDelivery,
      recentDeliveries: d.deliveries.slice(0, 10).map((del) => ({
        id: del.id,
        orderId: del.orderId,
        buyerName: del.order.buyerName,
        address: del.order.address,
        orderTotal: Number(del.orderTotal),
        date: del.createdAt,
      })),
    };
  });

  // Sort by trips descending to find top drivers
  driverStats.sort((a, b) => b.trips - a.trips);

  return serializePrisma({
    totalDeliveriesGlobal,
    totalAmountGlobal,
    topDriver: driverStats.length > 0 && driverStats[0].trips > 0 ? driverStats[0] : null,
    drivers: driverStats,
  });
}
