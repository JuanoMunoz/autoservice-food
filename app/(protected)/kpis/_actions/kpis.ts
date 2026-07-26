"use server";

import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/lib/generated/prisma/client";

export interface KPIData {
  // Main required KPIs
  todaySales: number;
  todayOrdersCount: number;
  todayVsYesterdayPercent: number;

  weekSales: number;
  weekOrdersCount: number;
  weekVsPrevWeekPercent: number;

  monthSales: number;
  monthOrdersCount: number;
  monthVsPrevMonthPercent: number;

  // General Financial & Operations
  totalSales: number;
  totalOrdersCount: number;
  activeOrdersCount: number;
  averageOrderValue: number; // Ticket promedio
  cancellationRate: number; // % canceladas

  // Status Funnel Breakdown
  ordersByStatus: {
    CREATED: number;
    PREPARING: number;
    DELIVERING: number;
    COMPLETED: number;
    CANCELLED: number;
  };

  // OnSite vs Delivery
  diningMode: {
    onSiteCount: number;
    onSiteSales: number;
    toGoCount: number;
    toGoSales: number;
    onSitePercent: number;
  };

  // Top Products (Comidas)
  topProducts: Array<{
    id: string;
    name: string;
    imageRoute: string | null;
    price: number;
    totalQuantity: number;
    totalRevenue: number;
  }>;

  // Top Drinks (Bebidas)
  topDrinks: Array<{
    id: string;
    name: string;
    imageRoute: string | null;
    price: number;
    totalQuantity: number;
    totalRevenue: number;
  }>;

  // Top Sauces (Salsas con su color HEX oficial)
  topSauces: Array<{
    id: string;
    name: string;
    hex: string;
    count: number;
  }>;

  // Top Extra Ingredients / Toppings
  topExtras: Array<{
    id: string;
    name: string;
    type: string;
    price: number;
    totalQuantity: number;
    totalRevenue: number;
  }>;

  // Peak Hours (00:00 to 23:00)
  salesByHour: Array<{
    hour: number;
    label: string;
    ordersCount: number;
    salesTotal: number;
  }>;

  // Sales by Day of Week
  salesByDayOfWeek: Array<{
    day: string;
    ordersCount: number;
    salesTotal: number;
  }>;

  // Top Tables
  topTables: Array<{
    tableNumber: number;
    ordersCount: number;
    salesTotal: number;
  }>;

  // Inventory / Menu counts
  menuStats: {
    totalProductsCount: number;
    totalDrinksCount: number;
    totalIngredientsCount: number;
    totalSaucesCount: number;
  };

  // Audit activity stats
  auditStats: {
    totalLogs: number;
    createCount: number;
    updateCount: number;
    deleteCount: number;
  };
}

export async function getKPIData(): Promise<KPIData> {
  const now = new Date();

  // Date ranges
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  // Week range (Last 7 days)
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const startOfPrevWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);

  // Month range (Current month 1st day)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Execute parallel queries
  const [
    allOrders,
    products,
    drinks,
    sauces,
    ingredients,
    auditLogs
  ] = await Promise.all([
    prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
            drink: true,
            sauces: {
              include: {
                sauce: true
              }
            },
            extras: {
              include: {
                ingredient: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.products.findMany(),
    prisma.drink.findMany(),
    prisma.sauce.findMany(),
    prisma.ingredients.findMany(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200
    })
  ]);

  // Non-cancelled orders helper
  const validOrders = allOrders.filter(o => o.status !== OrderStatus.CANCELLED);

  // 1. Venta del Día (Hoy)
  const todayOrders = validOrders.filter(o => new Date(o.createdAt) >= startOfToday);
  const yesterdayOrders = validOrders.filter(o => {
    const d = new Date(o.createdAt);
    return d >= startOfYesterday && d < startOfToday;
  });

  const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const yesterdaySales = yesterdayOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const todayVsYesterdayPercent = yesterdaySales > 0
    ? ((todaySales - yesterdaySales) / yesterdaySales) * 100
    : todaySales > 0 ? 100 : 0;

  // 2. Venta de la Semana (Últimos 7 días)
  const weekOrders = validOrders.filter(o => new Date(o.createdAt) >= startOfWeek);
  const prevWeekOrders = validOrders.filter(o => {
    const d = new Date(o.createdAt);
    return d >= startOfPrevWeek && d < startOfWeek;
  });

  const weekSales = weekOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const prevWeekSales = prevWeekOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const weekVsPrevWeekPercent = prevWeekSales > 0
    ? ((weekSales - prevWeekSales) / prevWeekSales) * 100
    : weekSales > 0 ? 100 : 0;

  // 3. Venta del Mes (Mes actual)
  const monthOrders = validOrders.filter(o => new Date(o.createdAt) >= startOfMonth);
  const prevMonthOrders = validOrders.filter(o => {
    const d = new Date(o.createdAt);
    return d >= startOfPrevMonth && d < startOfMonth;
  });

  const monthSales = monthOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const prevMonthSales = prevMonthOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const monthVsPrevMonthPercent = prevMonthSales > 0
    ? ((monthSales - prevMonthSales) / prevMonthSales) * 100
    : monthSales > 0 ? 100 : 0;

  // 4. Financial & Operations
  const totalSales = validOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalOrdersCount = allOrders.length;
  const activeOrdersCount = validOrders.length;
  const averageOrderValue = activeOrdersCount > 0 ? totalSales / activeOrdersCount : 0;

  const cancelledCount = allOrders.filter(o => o.status === OrderStatus.CANCELLED).length;
  const cancellationRate = totalOrdersCount > 0 ? (cancelledCount / totalOrdersCount) * 100 : 0;

  // 5. Orders by Status
  const ordersByStatus = {
    CREATED: allOrders.filter(o => o.status === OrderStatus.CREATED).length,
    PREPARING: allOrders.filter(o => o.status === OrderStatus.PREPARING).length,
    DELIVERING: allOrders.filter(o => o.status === OrderStatus.DELIVERING).length,
    COMPLETED: allOrders.filter(o => o.status === OrderStatus.COMPLETED).length,
    CANCELLED: cancelledCount
  };

  // 6. OnSite vs Delivery
  const onSiteOrders = validOrders.filter(o => o.onSite);
  const toGoOrders = validOrders.filter(o => !o.onSite);

  const onSiteSales = onSiteOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const toGoSales = toGoOrders.reduce((sum, o) => sum + Number(o.total), 0);

  const diningMode = {
    onSiteCount: onSiteOrders.length,
    onSiteSales,
    toGoCount: toGoOrders.length,
    toGoSales,
    onSitePercent: activeOrdersCount > 0 ? (onSiteOrders.length / activeOrdersCount) * 100 : 0
  };

  // 7. Top Products (Comidas)
  const productMap = new Map<string, { name: string; imageRoute: string | null; price: number; totalQuantity: number; totalRevenue: number }>();
  
  // 8. Top Drinks
  const drinkMap = new Map<string, { name: string; imageRoute: string | null; price: number; totalQuantity: number; totalRevenue: number }>();

  // 9. Top Sauces
  const sauceMap = new Map<string, { name: string; hex: string; count: number }>();

  // 10. Top Extras / Toppings
  const extraMap = new Map<string, { name: string; type: string; price: number; totalQuantity: number; totalRevenue: number }>();

  // Process item details from valid orders
  for (const order of validOrders) {
    for (const item of order.items) {
      // Products
      if (item.productId && item.product) {
        const existing = productMap.get(item.productId) || {
          name: item.product.name,
          imageRoute: item.product.imageRoute,
          price: Number(item.product.price),
          totalQuantity: 0,
          totalRevenue: 0
        };
        existing.totalQuantity += item.quantity;
        existing.totalRevenue += Number(item.unitPrice) * item.quantity;
        productMap.set(item.productId, existing);
      }

      // Drinks
      if (item.drinkId && item.drink) {
        const existing = drinkMap.get(item.drinkId) || {
          name: item.drink.name,
          imageRoute: item.drink.imageRoute,
          price: Number(item.drink.price),
          totalQuantity: 0,
          totalRevenue: 0
        };
        existing.totalQuantity += item.quantity;
        existing.totalRevenue += Number(item.unitPrice) * item.quantity;
        drinkMap.set(item.drinkId, existing);
      }

      // Sauces
      for (const itemSauce of item.sauces) {
        if (itemSauce.sauce) {
          const existing = sauceMap.get(itemSauce.sauceId) || {
            name: itemSauce.sauce.name,
            hex: itemSauce.sauce.hex,
            count: 0
          };
          existing.count += item.quantity; // Multiply by item quantity if ordered in bulk
          sauceMap.set(itemSauce.sauceId, existing);
        }
      }

      // Extras / Ingredients
      for (const itemExtra of item.extras) {
        if (itemExtra.ingredient) {
          const existing = extraMap.get(itemExtra.ingredientId) || {
            name: itemExtra.ingredient.name,
            type: itemExtra.ingredient.type,
            price: Number(itemExtra.unitPrice),
            totalQuantity: 0,
            totalRevenue: 0
          };
          existing.totalQuantity += itemExtra.quantity * item.quantity;
          existing.totalRevenue += Number(itemExtra.unitPrice) * itemExtra.quantity * item.quantity;
          extraMap.set(itemExtra.ingredientId, existing);
        }
      }
    }
  }

  const topProducts = Array.from(productMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 5);

  const topDrinks = Array.from(drinkMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 5);

  const topSauces = Array.from(sauceMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const topExtras = Array.from(extraMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 5);

  // 11. Sales by Hour (0 to 23)
  const hourBuckets = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: `${h.toString().padStart(2, "0")}:00`,
    ordersCount: 0,
    salesTotal: 0
  }));

  // 12. Sales by Day of Week
  const daysOfWeekNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const dayBuckets = daysOfWeekNames.map(day => ({
    day,
    ordersCount: 0,
    salesTotal: 0
  }));

  // 13. Top Tables
  const tableMap = new Map<number, { ordersCount: number; salesTotal: number }>();

  for (const order of validOrders) {
    const d = new Date(order.createdAt);
    const hour = d.getHours();
    const dayIdx = d.getDay();

    hourBuckets[hour].ordersCount += 1;
    hourBuckets[hour].salesTotal += Number(order.total);

    dayBuckets[dayIdx].ordersCount += 1;
    dayBuckets[dayIdx].salesTotal += Number(order.total);

    if (order.table !== null && order.table !== undefined) {
      const existing = tableMap.get(order.table) || { ordersCount: 0, salesTotal: 0 };
      existing.ordersCount += 1;
      existing.salesTotal += Number(order.total);
      tableMap.set(order.table, existing);
    }
  }

  const topTables = Array.from(tableMap.entries())
    .map(([tableNumber, data]) => ({ tableNumber, ...data }))
    .sort((a, b) => b.ordersCount - a.ordersCount)
    .slice(0, 5);

  // 14. Menu Stats
  const menuStats = {
    totalProductsCount: products.length,
    totalDrinksCount: drinks.length,
    totalIngredientsCount: ingredients.length,
    totalSaucesCount: sauces.length
  };

  // 15. Audit Stats
  const auditStats = {
    totalLogs: auditLogs.length,
    createCount: auditLogs.filter(l => l.action === "CREATE").length,
    updateCount: auditLogs.filter(l => l.action === "UPDATE").length,
    deleteCount: auditLogs.filter(l => l.action === "DELETE").length
  };

  return {
    todaySales,
    todayOrdersCount: todayOrders.length,
    todayVsYesterdayPercent,

    weekSales,
    weekOrdersCount: weekOrders.length,
    weekVsPrevWeekPercent,

    monthSales,
    monthOrdersCount: monthOrders.length,
    monthVsPrevMonthPercent,

    totalSales,
    totalOrdersCount,
    activeOrdersCount,
    averageOrderValue,
    cancellationRate,

    ordersByStatus,
    diningMode,

    topProducts,
    topDrinks,
    topSauces,
    topExtras,

    salesByHour: hourBuckets,
    salesByDayOfWeek: dayBuckets,
    topTables,

    menuStats,
    auditStats
  };
}
