"use client";

import { useState } from "react";
import { KPIData, getKPIData } from "../_actions/kpis";
import { formatCurrency } from "@/utils/cartStorage";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Clock,
  ShoppingBag,
  Flame,
  Utensils,
  GlassWater,
  Package,
  RefreshCw,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PieChart,
  BarChart3,
  Layers,
  Sparkles,
  Users,
  Store,
  Table
} from "lucide-react";

interface KPIsClientProps {
  initialData: KPIData;
}

export default function KPIsClient({ initialData }: KPIsClientProps) {
  const [data, setData] = useState<KPIData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<"resumen" | "productos" | "tendencias" | "sistema">("resumen");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await getKPIData();
      setData(refreshed);
      setLastUpdated(new Date());
      toast.success("Métricas actualizadas correctamente");
    } catch (err) {
      toast.error("Error al actualizar las métricas");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Find peak hour and peak day
  const maxHour = data.salesByHour.reduce((prev, current) => (current.ordersCount > prev.ordersCount ? current : prev), data.salesByHour[0]);
  const maxDay = data.salesByDayOfWeek.reduce((prev, current) => (current.ordersCount > prev.ordersCount ? current : prev), data.salesByDayOfWeek[0]);

  // Calculations for progress bars
  const maxProductQty = data.topProducts[0]?.totalQuantity || 1;
  const maxDrinkQty = data.topDrinks[0]?.totalQuantity || 1;
  const maxSauceCount = data.topSauces[0]?.count || 1;
  const maxHourQty = Math.max(...data.salesByHour.map(h => h.ordersCount), 1);
  const maxDayQty = Math.max(...data.salesByDayOfWeek.map(d => d.ordersCount), 1);

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-100">
      
      {/* ── HEADER ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-secondary/15 rounded-xl text-secondary border border-secondary/30">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-saira font-extrabold tracking-tight text-stone-100 flex items-center gap-2">
                Panel de KPIs & Métricas
              </h1>
              <p className="text-xs lg:text-sm text-slate-400 font-medium">
                Análisis financiero, volumen de pedidos y preferencias del cliente en tiempo real.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-secondary" />
            Act: {lastUpdated.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-stone-100 rounded-xl font-bold text-xs transition-all border border-slate-700 disabled:opacity-50 cursor-pointer shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-secondary" : ""}`} />
            {isRefreshing ? "Cargando..." : "Actualizar"}
          </button>
        </div>
      </div>

      {/* ── MAIN HIGHLIGHT HERO KPIS (LAS 3 PRINCIPALES) ─────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. VENTA DEL DÍA */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl group hover:border-emerald-500/40 transition-all">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="w-32 h-32 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Venta del Día
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-saira font-black text-stone-100 tracking-tight mb-2">
            {formatCurrency(data.todaySales)}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400">
              {data.todayOrdersCount} pedidos hoy
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
              data.todayVsYesterdayPercent >= 0 
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" 
                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
            }`}>
              {data.todayVsYesterdayPercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(data.todayVsYesterdayPercent).toFixed(1)}% vs ayer
            </span>
          </div>
        </div>

        {/* 2. VENTA DE LA SEMANA */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl group hover:border-amber-500/40 transition-all">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Calendar className="w-32 h-32 text-amber-400" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Venta de la Semana
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-saira font-black text-stone-100 tracking-tight mb-2">
            {formatCurrency(data.weekSales)}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400">
              {data.weekOrdersCount} ped. últimos 7d
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
              data.weekVsPrevWeekPercent >= 0 
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" 
                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
            }`}>
              {data.weekVsPrevWeekPercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(data.weekVsPrevWeekPercent).toFixed(1)}% vs sem. ant.
            </span>
          </div>
        </div>

        {/* 3. VENTA DEL MES */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl group hover:border-blue-500/40 transition-all">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-32 h-32 text-blue-400" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Venta del Mes
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-saira font-black text-stone-100 tracking-tight mb-2">
            {formatCurrency(data.monthSales)}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400">
              {data.monthOrdersCount} pedidos este mes
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
              data.monthVsPrevMonthPercent >= 0 
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" 
                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
            }`}>
              {data.monthVsPrevMonthPercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(data.monthVsPrevMonthPercent).toFixed(1)}% vs mes ant.
            </span>
          </div>
        </div>

        {/* 4. TICKET PROMEDIO (AOV) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl group hover:border-purple-500/40 transition-all">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShoppingBag className="w-32 h-32 text-purple-400" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
              Ticket Promedio
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-saira font-black text-stone-100 tracking-tight mb-2">
            {formatCurrency(data.averageOrderValue)}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400">
              Promedio por orden no cancelada
            </span>
          </div>
        </div>

      </div>

      {/* ── TABS NAVIGATION ──────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("resumen")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "resumen"
              ? "bg-stone-100 text-slate-950 shadow-lg"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <PieChart className="w-4 h-4" />
          Resumen General & Operativo
        </button>
        <button
          onClick={() => setActiveTab("productos")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "productos"
              ? "bg-stone-100 text-slate-950 shadow-lg"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Utensils className="w-4 h-4" />
          Comidas, Bebidas & Salsas
        </button>
        <button
          onClick={() => setActiveTab("tendencias")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "tendencias"
              ? "bg-stone-100 text-slate-950 shadow-lg"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Horas Pico & Días de Venta
        </button>
        <button
          onClick={() => setActiveTab("sistema")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "sistema"
              ? "bg-stone-100 text-slate-950 shadow-lg"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Layers className="w-4 h-4" />
          Mesas & Salud del Menú
        </button>
      </div>

      {/* ── TAB 1: RESUMEN GENERAL & OPERATIVO ──────────────── */}
      {activeTab === "resumen" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* ESTADO DE PEDIDOS (FUNNEL) */}
            <div className="lg:col-span-2 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-saira font-bold text-stone-100 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-secondary" />
                  Distribución por Estado de Pedidos
                </h2>
                <span className="text-xs font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  Total: {data.totalOrdersCount} pedidos históricamente
                </span>
              </div>

              {/* BARRA VISUAL MULTICOLOR DE ESTADO */}
              <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
                <div
                  style={{ width: `${data.totalOrdersCount > 0 ? (data.ordersByStatus.COMPLETED / data.totalOrdersCount) * 100 : 0}%` }}
                  className="bg-emerald-500 h-full transition-all"
                  title={`Completados: ${data.ordersByStatus.COMPLETED}`}
                />
                <div
                  style={{ width: `${data.totalOrdersCount > 0 ? (data.ordersByStatus.DELIVERING / data.totalOrdersCount) * 100 : 0}%` }}
                  className="bg-blue-500 h-full transition-all"
                  title={`En Entrega: ${data.ordersByStatus.DELIVERING}`}
                />
                <div
                  style={{ width: `${data.totalOrdersCount > 0 ? (data.ordersByStatus.PREPARING / data.totalOrdersCount) * 100 : 0}%` }}
                  className="bg-amber-500 h-full transition-all"
                  title={`En Preparación: ${data.ordersByStatus.PREPARING}`}
                />
                <div
                  style={{ width: `${data.totalOrdersCount > 0 ? (data.ordersByStatus.CREATED / data.totalOrdersCount) * 100 : 0}%` }}
                  className="bg-purple-500 h-full transition-all"
                  title={`Nuevos: ${data.ordersByStatus.CREATED}`}
                />
                <div
                  style={{ width: `${data.totalOrdersCount > 0 ? (data.ordersByStatus.CANCELLED / data.totalOrdersCount) * 100 : 0}%` }}
                  className="bg-rose-500 h-full transition-all"
                  title={`Cancelados: ${data.ordersByStatus.CANCELLED}`}
                />
              </div>

              {/* GRID DESGLOSE ESTADOS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Completados
                  </span>
                  <p className="text-xl font-black text-stone-100">{data.ordersByStatus.COMPLETED}</p>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    En Entrega
                  </span>
                  <p className="text-xl font-black text-stone-100">{data.ordersByStatus.DELIVERING}</p>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Preparando
                  </span>
                  <p className="text-xl font-black text-stone-100">{data.ordersByStatus.PREPARING}</p>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Nuevos
                  </span>
                  <p className="text-xl font-black text-stone-100">{data.ordersByStatus.CREATED}</p>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Cancelados
                  </span>
                  <p className="text-xl font-black text-rose-400">{data.ordersByStatus.CANCELLED}</p>
                </div>
              </div>

              {/* TASA DE CANCELACION METRIC */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${data.cancellationRate > 5 ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-200">Tasa de Cancelación de Pedidos</p>
                    <p className="text-[11px] text-slate-400">Porcentaje de pedidos anulados sobre el total</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-black ${data.cancellationRate > 5 ? "text-rose-400" : "text-emerald-400"}`}>
                    {data.cancellationRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* CONSUMO EN LOCAL VS PARA LLEVAR */}
            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-4">
              <div>
                <h2 className="text-lg font-saira font-bold text-stone-100 flex items-center gap-2 mb-2">
                  <Utensils className="w-5 h-5 text-secondary" />
                  Modalidad de Consumo
                </h2>
                <p className="text-xs text-slate-400">
                  Comparativa de clientes que comen en mesa vs para llevar.
                </p>
              </div>

              <div className="space-y-4">
                {/* EN LOCAL */}
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-stone-200 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                      En Local (Mesa)
                    </span>
                    <span className="text-xs font-extrabold text-secondary">
                      {data.diningMode.onSitePercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-lg font-black text-stone-100">
                    {formatCurrency(data.diningMode.onSiteSales)}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 mt-1">
                    {data.diningMode.onSiteCount} pedidos en mesa
                  </div>
                </div>

                {/* PARA LLEVAR */}
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-stone-200 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                      Para Llevar / Domicilio
                    </span>
                    <span className="text-xs font-extrabold text-blue-400">
                      {(100 - data.diningMode.onSitePercent).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-lg font-black text-stone-100">
                    {formatCurrency(data.diningMode.toGoSales)}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 mt-1">
                    {data.diningMode.toGoCount} pedidos para llevar
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-center">
                <p className="text-xs font-bold text-slate-400">
                  Venta Total Acumulada: <span className="text-stone-100 font-extrabold">{formatCurrency(data.totalSales)}</span>
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── TAB 2: COMIDAS, BEBIDAS & SALSAS ──────────────────── */}
      {activeTab === "productos" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* TOP COMIDAS */}
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-saira font-bold text-stone-100 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-secondary" />
                Top 5 Comidas Más Vendidas
              </h2>
              <Award className="w-5 h-5 text-amber-400" />
            </div>

            <div className="space-y-3">
              {data.topProducts.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No hay datos de productos vendidos aún.</p>
              ) : (
                data.topProducts.map((prod, idx) => {
                  const pct = (prod.totalQuantity / maxProductQty) * 100;
                  return (
                    <div key={prod.id} className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                            idx === 0 ? "bg-amber-400 text-slate-950" : idx === 1 ? "bg-slate-300 text-slate-950" : idx === 2 ? "bg-amber-700 text-stone-100" : "bg-slate-800 text-slate-400"
                          }`}>
                            #{idx + 1}
                          </span>
                          {prod.imageRoute ? (
                            <img src={prod.imageRoute} alt={prod.name} className="w-9 h-9 rounded-lg object-cover bg-slate-900 border border-slate-800" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                              <Utensils className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-stone-100 leading-tight">{prod.name}</p>
                            <p className="text-[11px] text-slate-400">{formatCurrency(prod.price)} / un.</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-stone-100 block">{prod.totalQuantity} un.</span>
                          <span className="text-xs font-semibold text-emerald-400">{formatCurrency(prod.totalRevenue)}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div style={{ width: `${pct}%` }} className="h-full bg-secondary rounded-full" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* TOP BEBIDAS */}
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-saira font-bold text-stone-100 flex items-center gap-2">
                <GlassWater className="w-5 h-5 text-blue-400" />
                Top 5 Bebidas Más Vendidas
              </h2>
              <Award className="w-5 h-5 text-blue-400" />
            </div>

            <div className="space-y-3">
              {data.topDrinks.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No hay datos de bebidas vendidas aún.</p>
              ) : (
                data.topDrinks.map((drink, idx) => {
                  const pct = (drink.totalQuantity / maxDrinkQty) * 100;
                  return (
                    <div key={drink.id} className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                            idx === 0 ? "bg-blue-400 text-slate-950" : "bg-slate-800 text-slate-400"
                          }`}>
                            #{idx + 1}
                          </span>
                          {drink.imageRoute ? (
                            <img src={drink.imageRoute} alt={drink.name} className="w-9 h-9 rounded-lg object-cover bg-slate-900 border border-slate-800" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                              <GlassWater className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-stone-100 leading-tight">{drink.name}</p>
                            <p className="text-[11px] text-slate-400">{formatCurrency(drink.price)} / un.</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-stone-100 block">{drink.totalQuantity} un.</span>
                          <span className="text-xs font-semibold text-blue-400">{formatCurrency(drink.totalRevenue)}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div style={{ width: `${pct}%` }} className="h-full bg-blue-500 rounded-full" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SALSAS PREFERIDAS */}
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
            <h2 className="text-lg font-saira font-bold text-stone-100 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              Salsas Favoritas de los Clientes
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.topSauces.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 col-span-2 text-center">No hay registro de salsas solicitadas.</p>
              ) : (
                data.topSauces.map((sauce) => (
                  <div key={sauce.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full border border-white/20 shadow-md shrink-0"
                        style={{ backgroundColor: sauce.hex }}
                      />
                      <span className="text-xs font-bold text-stone-200">{sauce.name}</span>
                    </div>
                    <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      {sauce.count} solicitadas
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* EXTRAS / TOPPINGS MÁS PEDIDOS */}
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
            <h2 className="text-lg font-saira font-bold text-stone-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" />
              Ingredientes Extra & Toppings
            </h2>

            <div className="space-y-2.5">
              {data.topExtras.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No se han vendido toppings extra aún.</p>
              ) : (
                data.topExtras.map((extra) => (
                  <div key={extra.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-stone-200">{extra.name}</p>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {extra.type === "FOOD" ? "Comida" : "Bebida"} · {formatCurrency(extra.price)} c/u
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-stone-100 block">{extra.totalQuantity} añadidos</span>
                      <span className="text-[11px] font-bold text-emerald-400">{formatCurrency(extra.totalRevenue)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 3: HORAS PICO & DÍAS DE VENTA ────────────────── */}
      {activeTab === "tendencias" && (
        <div className="space-y-6">
          
          {/* CARDS DE RESUMEN TENDENCIAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hora de Mayor Demanda (Hora Pico)</p>
                <p className="text-xl font-saira font-extrabold text-stone-100">
                  {maxHour.label} hs ({maxHour.ordersCount} pedidos)
                </p>
                <p className="text-xs text-amber-400 font-semibold">{formatCurrency(maxHour.salesTotal)} en esta hora</p>
              </div>
            </div>

            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Día Más Concurrido de la Semana</p>
                <p className="text-xl font-saira font-extrabold text-stone-100">
                  {maxDay.day} ({maxDay.ordersCount} pedidos)
                </p>
                <p className="text-xs text-blue-400 font-semibold">{formatCurrency(maxDay.salesTotal)} acumulado</p>
              </div>
            </div>
          </div>

          {/* GRÁFICO HORAS PICO (00 a 23h) */}
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
            <h2 className="text-lg font-saira font-bold text-stone-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary" />
              Volumen de Pedidos por Hora del Día (00:00 a 23:00)
            </h2>

            <div className="h-48 flex items-end gap-1.5 pt-6 pb-2 overflow-x-auto">
              {data.salesByHour.map((item) => {
                const heightPct = maxHourQty > 0 ? (item.ordersCount / maxHourQty) * 100 : 0;
                const isPeak = item.hour === maxHour.hour && item.ordersCount > 0;
                return (
                  <div key={item.hour} className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-[10px] text-stone-100 font-bold px-2 py-1 rounded shadow border border-slate-800 pointer-events-none whitespace-nowrap z-20">
                      {item.label}: {item.ordersCount} ped. ({formatCurrency(item.salesTotal)})
                    </div>

                    <div className="w-full bg-slate-950 rounded-t-sm h-full flex items-end justify-center p-0.5">
                      <div
                        style={{ height: `${Math.max(heightPct, 4)}%` }}
                        className={`w-full rounded-t transition-all ${
                          isPeak ? "bg-amber-400 shadow-lg shadow-amber-500/20" : item.ordersCount > 0 ? "bg-secondary/70 hover:bg-secondary" : "bg-slate-800/40"
                        }`}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 group-hover:text-slate-200">
                      {item.hour}h
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GRÁFICO DÍAS DE LA SEMANA */}
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
            <h2 className="text-lg font-saira font-bold text-stone-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" />
              Ventas por Día de la Semana
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
              {data.salesByDayOfWeek.map((dayItem) => {
                const pct = maxDayQty > 0 ? (dayItem.ordersCount / maxDayQty) * 100 : 0;
                const isTopDay = dayItem.day === maxDay.day && dayItem.ordersCount > 0;
                return (
                  <div key={dayItem.day} className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 ${
                    isTopDay ? "bg-secondary/15 border-secondary/40" : "bg-slate-950/60 border-slate-800"
                  }`}>
                    <div>
                      <span className="text-xs font-bold text-stone-200 block">{dayItem.day}</span>
                      <span className="text-[11px] font-bold text-slate-400">{dayItem.ordersCount} pedidos</span>
                    </div>

                    <div className="text-sm font-black text-stone-100">
                      {formatCurrency(dayItem.salesTotal)}
                    </div>

                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div style={{ width: `${pct}%` }} className={`h-full ${isTopDay ? "bg-secondary" : "bg-blue-500"}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 4: MESAS & SALUD DEL MENÚ ───────────────────── */}
      {activeTab === "sistema" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* TOP MESAS */}
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
            <h2 className="text-lg font-saira font-bold text-stone-100 flex items-center gap-2">
              <Table className="w-5 h-5 text-secondary" />
              Mesas con Mayor Frecuencia de Consumo
            </h2>

            <div className="space-y-2.5">
              {data.topTables.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No hay registros de mesa especificados en los pedidos.</p>
              ) : (
                data.topTables.map((table, idx) => (
                  <div key={table.tableNumber} className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center font-black text-sm border border-secondary/30">
                        #{table.tableNumber}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-100">Mesa N° {table.tableNumber}</p>
                        <p className="text-[11px] text-slate-400">{table.ordersCount} pedidos atendidos</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-emerald-400">
                      {formatCurrency(table.salesTotal)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* INVENTARIO / SALUD DEL MENÚ */}
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
            <h2 className="text-lg font-saira font-bold text-stone-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-secondary" />
              Catálogo de Menú Activo
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <Utensils className="w-5 h-5 text-secondary mb-2" />
                <p className="text-2xl font-black text-stone-100">{data.menuStats.totalProductsCount}</p>
                <p className="text-xs font-semibold text-slate-400">Productos / Comidas</p>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <GlassWater className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-2xl font-black text-stone-100">{data.menuStats.totalDrinksCount}</p>
                <p className="text-xs font-semibold text-slate-400">Bebidas Heladas</p>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <Package className="w-5 h-5 text-emerald-400 mb-2" />
                <p className="text-2xl font-black text-stone-100">{data.menuStats.totalIngredientsCount}</p>
                <p className="text-xs font-semibold text-slate-400">Ingredientes & Extras</p>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <Flame className="w-5 h-5 text-amber-500 mb-2" />
                <p className="text-2xl font-black text-stone-100">{data.menuStats.totalSaucesCount}</p>
                <p className="text-xs font-semibold text-slate-400">Salsas de la Casa</p>
              </div>
            </div>

            {/* AUDIT LOG SUMMARY */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <p className="text-xs font-bold text-stone-200">Actividad de Auditoría del Menú (Staff)</p>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {data.auditStats.createCount} Creados
                </span>
                <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {data.auditStats.updateCount} Modificados
                </span>
                <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  {data.auditStats.deleteCount} Eliminados
                </span>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
