"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { groupPaymentMethod, type SettlementPaymentGroup } from "@/lib/payment-groups";
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
          driverEarning: true,
          createdAt: true,
          order: { select: { onSite: true } },
        },
      },
    },
  });

  const formattedDrivers = drivers.map((driver) => {
    const totalDeliveries = driver.deliveries.length;
    const totalAmount = driver.deliveries.reduce((acc, curr) => acc + Number(curr.orderTotal), 0);
    // Neto tienda = lo que se queda el negocio (total menos domicilio); ganancia = domicilios
    const totalEarnings = driver.deliveries.reduce((acc, curr) => acc + Number(curr.driverEarning), 0);
    const netAmount = driver.deliveries.reduce(
      (acc, curr) => acc + Number(curr.orderTotal) - (curr.order.onSite ? 0 : Number(curr.driverEarning)),
      0
    );
    const lastDelivery = driver.deliveries.length > 0
      ? driver.deliveries.reduce((latest, curr) => curr.createdAt > latest ? curr.createdAt : latest, driver.deliveries[0].createdAt).toISOString()
      : null;

    return {
      ...driver,
      totalDeliveries,
      totalAmount,
      netAmount,
      totalEarnings,
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
  notes?: string,
  paymentMethod?: string | null
) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Pedido no encontrado.");
  }

  const normalizedPayment =
    paymentMethod === "cash" || paymentMethod === "transfer"
      ? paymentMethod
      : order.paymentMethod ?? null;

  // Update order status to COMPLETED (guarda el pago si la orden no lo tenía)
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "COMPLETED",
      ...(order.paymentMethod ? {} : { paymentMethod: normalizedPayment }),
    },
  });

  // If driver assigned, create delivery log with earning snapshot
  if (driverId) {
    const driver = await prisma.deliveryDriver.findUnique({ where: { id: driverId } });
    if (driver) {
      await prisma.deliveryLog.create({
        data: {
          orderId,
          driverId,
          orderTotal: order.total,
          notes: notes?.trim() || null,
          paymentMethod: normalizedPayment,
          driverEarning: order.onSite ? 0 : order.deliveryFee,
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
    driverEarning: Number(log.driverEarning),
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
              onSite: true,
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
    const totalEarnings = d.deliveries.reduce((sum, del) => sum + Number(del.driverEarning), 0);
    const netMoney = d.deliveries.reduce(
      (sum, del) => sum + Number(del.orderTotal) - (del.order.onSite ? 0 : Number(del.driverEarning)),
      0
    );
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
      netMoney,
      totalEarnings,
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

export type { SettlementPaymentGroup };

export interface SettlementDetail {
  logId: string;
  orderId: number;
  buyerName: string;
  address: string;
  onSite: boolean;
  paymentGroup: SettlementPaymentGroup;
  earning: number;
  date: string;
}

export interface DriverSettlement {
  driverId: string;
  driverName: string;
  trips: number;
  earnings: number;
  cash: { count: number; earnings: number };
  transfer: { count: number; earnings: number };
  unknown: { count: number; earnings: number };
  details: SettlementDetail[];
}

/** Agrupa card+transfer como transferencia; null/otros = no registrado (ver lib/payment-groups) */

/**
 * Liquidación por domiciliario en un rango [fromISO, toISO].
 * Ganancia = driverEarning snapshot (valor del domicilio al despachar).
 */
export async function getDriverSettlements(fromISO: string, toISO: string, driverId?: string) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const from = new Date(fromISO);
  const to = new Date(toISO);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error("Rango de fechas inválido.");
  }

  const logs = await prisma.deliveryLog.findMany({
    where: {
      createdAt: { gte: from, lte: to },
      ...(driverId ? { driverId } : {}),
    },
    include: {
      driver: { select: { id: true, name: true } },
      order: {
        select: {
          id: true,
          buyerName: true,
          address: true,
          onSite: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });

  const byDriver = new Map<string, DriverSettlement>();
  for (const log of logs) {
    const earning = Number(log.driverEarning);
    const group = groupPaymentMethod(log.paymentMethod);
    let entry = byDriver.get(log.driverId);
    if (!entry) {
      entry = {
        driverId: log.driverId,
        driverName: log.driver.name,
        trips: 0,
        earnings: 0,
        cash: { count: 0, earnings: 0 },
        transfer: { count: 0, earnings: 0 },
        unknown: { count: 0, earnings: 0 },
        details: [],
      };
      byDriver.set(log.driverId, entry);
    }
    entry.trips += 1;
    entry.earnings += earning;
    entry[group].count += 1;
    entry[group].earnings += earning;
    entry.details.push({
      logId: log.id,
      orderId: log.orderId,
      buyerName: log.order.buyerName,
      address: log.order.address,
      onSite: log.order.onSite,
      paymentGroup: group,
      earning,
      date: log.createdAt.toISOString(),
    });
  }

  const settlements = [...byDriver.values()].sort((a, b) => b.earnings - a.earnings);
  const totals = settlements.reduce(
    (acc, s) => ({
      trips: acc.trips + s.trips,
      earnings: acc.earnings + s.earnings,
      cashCount: acc.cashCount + s.cash.count,
      transferCount: acc.transferCount + s.transfer.count,
      unknownCount: acc.unknownCount + s.unknown.count,
    }),
    { trips: 0, earnings: 0, cashCount: 0, transferCount: 0, unknownCount: 0 }
  );

  return serializePrisma({ settlements, totals, from: from.toISOString(), to: to.toISOString() });
}

// ─── CUADRE DE CUENTAS CON DOMICILIARIOS ─────────────────────────────
// Balance desde la perspectiva del NEGOCIO hacia el driver:
//   positivo  = el negocio le debe plata al domiciliario (hay que pagarle)
//   negativo  = el domiciliario le debe plata al negocio (hay que cobrársela)
// Efectivo: el driver cobró el total y se queda el domicilio → debe entregar (total - domicilio).
// Transferencia: la plata entró al negocio → se le debe al driver el domicilio.

export type CuadreDirection = "driver_owes" | "business_owes" | "none";

export interface CuadreItem {
  logId: string;
  orderId: number;
  buyerName: string;
  address: string;
  onSite: boolean;
  paymentGroup: SettlementPaymentGroup;
  orderTotal: number;
  earning: number;
  /** Monto esperado del cuadre (lo que debe moverse de manos) */
  expected: number;
  direction: CuadreDirection;
  date: string;
  settled: boolean;
  settledAt: string | null;
  settledAmount: number | null;
  settledNote: string | null;
}

export interface DriverCuadre {
  driverId: string;
  driverName: string;
  /** Balance neto pendiente (+ = hay que pagarle / − = debe entregar) */
  balance: number;
  /** Efectivo pendiente que el driver debe entregar */
  toCollect: number;
  /** Domicilios de transferencia pendientes por pagarle */
  toPay: number;
  pending: CuadreItem[];
  settled: CuadreItem[];
}

export interface CuadresSummary {
  /** Vendido neto de la tienda en el período (totales menos domicilios) */
  netSales: number;
  grossSales: number;
  /** Suma de domicilios cobrados (ganancia total de repartidores) */
  deliveryFees: number;
  toCollect: number;
  toPay: number;
  /** Efectivo ya recibido de drivers (cuadres cash) */
  collected: number;
  /** Domicilios ya pagados a drivers (cuadres transfer) */
  paidOut: number;
  pendingCount: number;
  settledCount: number;
  from: string;
  to: string;
}

function cuadreExpectation(
  onSite: boolean,
  paymentGroup: SettlementPaymentGroup,
  orderTotal: number,
  earning: number
): { expected: number; direction: CuadreDirection } {
  if (onSite) return { expected: 0, direction: "none" };
  if (paymentGroup === "cash") {
    return { expected: Math.max(0, orderTotal - earning), direction: "driver_owes" };
  }
  if (paymentGroup === "transfer") {
    return { expected: Math.max(0, earning), direction: "business_owes" };
  }
  return { expected: 0, direction: "none" };
}

export async function getCuadres(fromISO: string, toISO: string, driverId?: string) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const from = new Date(fromISO);
  const to = new Date(toISO);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error("Rango de fechas inválido.");
  }

  const [logs, completedOrders] = await Promise.all([
    prisma.deliveryLog.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        ...(driverId ? { driverId } : {}),
      },
      include: {
        driver: { select: { id: true, name: true } },
        order: {
          select: {
            id: true,
            buyerName: true,
            address: true,
            onSite: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 2000,
    }),
    prisma.order.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: from, lte: to },
      },
      select: { total: true, deliveryFee: true, onSite: true },
    }),
  ]);

  const byDriver = new Map<string, DriverCuadre>();
  const summary: CuadresSummary = {
    netSales: 0,
    grossSales: 0,
    deliveryFees: 0,
    toCollect: 0,
    toPay: 0,
    collected: 0,
    paidOut: 0,
    pendingCount: 0,
    settledCount: 0,
    from: from.toISOString(),
    to: to.toISOString(),
  };

  for (const o of completedOrders) {
    const total = Number(o.total);
    const fee = o.onSite ? 0 : Number(o.deliveryFee);
    summary.grossSales += total;
    summary.netSales += total - fee;
    summary.deliveryFees += fee;
  }

  for (const log of logs) {
    const orderTotal = Number(log.orderTotal);
    const earning = Number(log.driverEarning);
    const group = groupPaymentMethod(log.paymentMethod);
    const { expected, direction } = cuadreExpectation(log.order.onSite, group, orderTotal, earning);

    let entry = byDriver.get(log.driverId);
    if (!entry) {
      entry = {
        driverId: log.driverId,
        driverName: log.driver.name,
        balance: 0,
        toCollect: 0,
        toPay: 0,
        pending: [],
        settled: [],
      };
      byDriver.set(log.driverId, entry);
    }

    const item: CuadreItem = {
      logId: log.id,
      orderId: log.orderId,
      buyerName: log.order.buyerName,
      address: log.order.address,
      onSite: log.order.onSite,
      paymentGroup: group,
      orderTotal,
      earning,
      expected,
      direction,
      date: log.createdAt.toISOString(),
      settled: log.settled,
      settledAt: log.settledAt ? log.settledAt.toISOString() : null,
      settledAmount: log.settledAmount !== null ? Number(log.settledAmount) : null,
      settledNote: log.settledNote,
    };

    if (log.settled) {
      entry.settled.push(item);
      summary.settledCount += 1;
      const real = item.settledAmount ?? expected;
      if (direction === "driver_owes") summary.collected += real;
      if (direction === "business_owes") summary.paidOut += real;
    } else {
      entry.pending.push(item);
      summary.pendingCount += 1;
      if (direction === "driver_owes") {
        entry.balance -= expected;
        entry.toCollect += expected;
        summary.toCollect += expected;
      } else if (direction === "business_owes") {
        entry.balance += expected;
        entry.toPay += expected;
        summary.toPay += expected;
      }
    }
  }

  const drivers = [...byDriver.values()].sort(
    (a, b) => Math.abs(b.balance) - Math.abs(a.balance)
  );

  return serializePrisma({ drivers, summary });
}

export async function settleDeliveryLog(logId: string, settledAmount: number, note?: string) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const log = await prisma.deliveryLog.findUnique({
    where: { id: logId },
    include: { order: { select: { onSite: true } } },
  });
  if (!log) throw new Error("Registro de domicilio no encontrado.");
  if (log.settled) throw new Error("Esta orden ya está cuadrada.");

  if (typeof settledAmount !== "number" || !Number.isFinite(settledAmount) || settledAmount < 0) {
    throw new Error("Monto inválido para el cuadre.");
  }

  const updated = await runWithAuditContext(async () => {
    return prisma.deliveryLog.update({
      where: { id: logId },
      data: {
        settled: true,
        settledAt: new Date(),
        settledAmount: new Prisma.Decimal(Math.round(settledAmount)),
        settledNote: note?.trim() || null,
      },
    });
  });

  revalidatePath("/dashboard/cuadres");
  revalidatePath("/dashboard/domiciliarios");
  return serializePrisma(updated);
}

export async function settleAllDriverLogs(driverId: string, fromISO: string, toISO: string) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  const from = new Date(fromISO);
  const to = new Date(toISO);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error("Rango de fechas inválido.");
  }

  const pending = await prisma.deliveryLog.findMany({
    where: {
      driverId,
      settled: false,
      createdAt: { gte: from, lte: to },
    },
    include: { order: { select: { onSite: true } } },
  });

  if (pending.length === 0) {
    return serializePrisma({ settled: 0, totalExpected: 0 });
  }

  let totalExpected = 0;
  await runWithAuditContext(async () => {
    await prisma.$transaction(
      pending.map((log) => {
        const { expected } = cuadreExpectation(
          log.order.onSite,
          groupPaymentMethod(log.paymentMethod),
          Number(log.orderTotal),
          Number(log.driverEarning)
        );
        totalExpected += expected;
        return prisma.deliveryLog.update({
          where: { id: log.id },
          data: {
            settled: true,
            settledAt: new Date(),
            settledAmount: new Prisma.Decimal(expected),
            settledNote: "Cuadre masivo",
          },
        });
      })
    );
  });

  revalidatePath("/dashboard/cuadres");
  revalidatePath("/dashboard/domiciliarios");
  return serializePrisma({ settled: pending.length, totalExpected });
}
