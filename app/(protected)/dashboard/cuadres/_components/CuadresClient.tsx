"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bike,
  HandCoins,
  Store,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  X,
  History,
} from "lucide-react";
import {
  getCuadres,
  settleDeliveryLog,
  settleAllDriverLogs,
} from "../../(core)/_actions/domiciliarios";
import { groupPaymentMethod } from "@/lib/payment-groups";

type CuadresData = Awaited<ReturnType<typeof getCuadres>>;

interface DriverOption {
  id: string;
  name: string;
  active: boolean;
}

export default function CuadresClient({ initialDrivers }: { initialDrivers: DriverOption[] }) {
  type Period = "day" | "week" | "month";
  const [period, setPeriod] = useState<Period>("day");
  const [driverFilter, setDriverFilter] = useState<string>("all");
  const [data, setData] = useState<CuadresData | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal cuadrar individual
  const [settleTarget, setSettleTarget] = useState<{
    logId: string;
    orderId: number;
    driverName: string;
    direction: string;
    expected: number;
  } | null>(null);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleNote, setSettleNote] = useState("");
  const [settling, setSettling] = useState(false);

  // Confirmación cuadre masivo
  const [massTarget, setMassTarget] = useState<{
    driverId: string;
    driverName: string;
    count: number;
    toCollect: number;
    toPay: number;
  } | null>(null);
  const [massLoading, setMassLoading] = useState(false);

  const [showHistory, setShowHistory] = useState(false);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);

  const formatDate = (dateVal?: string | null) => {
    if (!dateVal) return "—";
    return new Date(dateVal).toLocaleString("es-CO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const rangeForPeriod = (p: Period) => {
    const now = new Date();
    const from = new Date(now);
    if (p === "day") {
      from.setHours(0, 0, 0, 0);
    } else if (p === "week") {
      const dowMon0 = (now.getDay() + 6) % 7;
      from.setDate(now.getDate() - dowMon0);
      from.setHours(0, 0, 0, 0);
    } else {
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
    }
    return { from: from.toISOString(), to: now.toISOString() };
  };

  const load = async (p: Period, driver: string) => {
    setLoading(true);
    try {
      const { from, to } = rangeForPeriod(p);
      const res = await getCuadres(from, to, driver === "all" ? undefined : driver);
      setData(res);
    } catch {
      toast.error("No se pudieron cargar los cuadres.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(period, driverFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changePeriod = (p: Period) => {
    setPeriod(p);
    load(p, driverFilter);
  };

  const changeDriver = (d: string) => {
    setDriverFilter(d);
    load(period, d);
  };

  const paymentBadge = (pm?: string | null) => {
    const g = groupPaymentMethod(pm);
    if (g === "cash")
      return (
        <span className="inline-flex items-center text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          Efectivo
        </span>
      );
    if (g === "transfer")
      return (
        <span className="inline-flex items-center text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
          Transferencia
        </span>
      );
    return (
      <span className="inline-flex items-center text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/30">
        No registrado
      </span>
    );
  };

  const openSettle = (item: {
    logId: string;
    orderId: number;
    direction: string;
    expected: number;
  }, driverName: string) => {
    setSettleTarget({ ...item, driverName });
    setSettleAmount(String(item.expected));
    setSettleNote("");
  };

  const confirmSettle = async () => {
    if (!settleTarget) return;
    const amount = Number(settleAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Escribe un monto válido (0 o más).");
      return;
    }
    setSettling(true);
    try {
      await settleDeliveryLog(settleTarget.logId, Math.round(amount), settleNote);
      toast.success(`Orden #${settleTarget.orderId} cuadrada correctamente`);
      setSettleTarget(null);
      load(period, driverFilter);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cuadrar la orden.");
    } finally {
      setSettling(false);
    }
  };

  const confirmMass = async () => {
    if (!massTarget) return;
    setMassLoading(true);
    try {
      const { from, to } = rangeForPeriod(period);
      const res = await settleAllDriverLogs(massTarget.driverId, from, to);
      toast.success(
        `${res.settled} orden(es) cuadradas por ${formatMoney(res.totalExpected)}`
      );
      setMassTarget(null);
      load(period, driverFilter);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo hacer el cuadre masivo.");
    } finally {
      setMassLoading(false);
    }
  };

  const summary = data?.summary;
  const settleDiff =
    settleTarget !== null ? Number(settleAmount) - settleTarget.expected : 0;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Período">
          {(
            [
              { id: "day", label: "Hoy" },
              { id: "week", label: "Semana" },
              { id: "month", label: "Mes" },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => changePeriod(p.id)}
              aria-pressed={period === p.id}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                period === p.id
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <select
          value={driverFilter}
          onChange={(e) => changeDriver(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
          aria-label="Filtrar por domiciliario"
        >
          <option value="all">Todos los domiciliarios</option>
          {initialDrivers
            .filter((d) => d.active)
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
        </select>
      </div>

      {loading || !summary ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-sm text-slate-400">
          {loading ? "Cargando cuadres..." : "Sin datos."}
        </div>
      ) : (
        <>
          {/* ── RESUMEN ECONÓMICO ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                Vendido neto tienda
              </p>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {formatMoney(summary.netSales)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Bruto {formatMoney(summary.grossSales)} − domicilios{" "}
                {formatMoney(summary.deliveryFees)}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-rose-500/30">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ArrowDownCircle className="w-3.5 h-3.5 text-rose-400" />
                Por cobrar a domiciliarios
              </p>
              <p className="text-2xl font-black text-rose-400 mt-1">
                {formatMoney(summary.toCollect)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Efectivo en manos de repartidores · ya recibido{" "}
                {formatMoney(summary.collected)}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-sky-500/30">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ArrowUpCircle className="w-3.5 h-3.5 text-sky-400" />
                Por pagar a domiciliarios
              </p>
              <p className="text-2xl font-black text-sky-400 mt-1">
                {formatMoney(summary.toPay)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Domicilios de transferencias · ya pagado {formatMoney(summary.paidOut)}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <HandCoins className="w-3.5 h-3.5 text-amber-400" />
                Órdenes por cuadrar
              </p>
              <p className="text-2xl font-black text-white mt-1">
                {summary.pendingCount}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {summary.settledCount} ya cuadrada(s) en el período
              </p>
            </div>
          </div>

          {/* ── POR DOMICILIARIO ── */}
          {data.drivers.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
              <Bike className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-300">
                Sin domicilios en este período
              </h3>
            </div>
          ) : (
            <div className="space-y-4">
              {data.drivers.map((d) => (
                <div
                  key={d.driverId}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                        <Bike className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{d.driverName}</h4>
                        <p className="text-xs text-slate-400">
                          {d.pending.length} pendiente(s) · {d.settled.length} cuadrada(s)
                        </p>
                      </div>
                    </div>
                    {d.balance === 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-black px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-4 h-4" /> A paz y salvo
                      </span>
                    ) : d.balance < 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-black px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        Debe entregar {formatMoney(Math.abs(d.balance))}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm font-black px-3 py-1.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                        Hay que pagarle {formatMoney(d.balance)}
                      </span>
                    )}
                  </div>

                  {d.pending.length > 0 && (
                    <>
                      <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-left text-sm text-slate-300">
                          <thead className="bg-slate-950 text-xs text-slate-400 uppercase">
                            <tr>
                              <th className="p-3">Fecha</th>
                              <th className="p-3"># Orden</th>
                              <th className="p-3">Cliente</th>
                              <th className="p-3">Pago</th>
                              <th className="p-3 text-right">Total</th>
                              <th className="p-3 text-right">Domicilio</th>
                              <th className="p-3 text-right">A mover</th>
                              <th className="p-3 text-right">Cuadrar</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {d.pending.map((item) => (
                              <tr key={item.logId} className="hover:bg-slate-800/40 transition">
                                <td className="p-3 text-xs text-slate-400 whitespace-nowrap">
                                  {formatDate(item.date)}
                                </td>
                                <td className="p-3 font-mono font-bold text-amber-400">
                                  #{item.orderId}
                                </td>
                                <td className="p-3 text-xs max-w-55 truncate">
                                  <span className="text-slate-200 font-bold">{item.buyerName}</span>
                                  <span className="text-slate-500">
                                    {" "}
                                    — {item.onSite ? "Local" : item.address}
                                  </span>
                                </td>
                                <td className="p-3">{paymentBadge(item.paymentGroup === "cash" ? "cash" : item.paymentGroup === "transfer" ? "transfer" : null)}</td>
                                <td className="p-3 text-right font-bold text-slate-200">
                                  {formatMoney(item.orderTotal)}
                                </td>
                                <td className="p-3 text-right font-bold text-slate-400">
                                  {formatMoney(item.earning)}
                                </td>
                                <td className="p-3 text-right">
                                  {item.direction === "driver_owes" ? (
                                    <span className="font-black text-rose-400">
                                      Entrega {formatMoney(item.expected)}
                                    </span>
                                  ) : item.direction === "business_owes" ? (
                                    <span className="font-black text-sky-400">
                                      Recibe {formatMoney(item.expected)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 text-xs">—</span>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openSettle(
                                        {
                                          logId: item.logId,
                                          orderId: item.orderId,
                                          direction: item.direction,
                                          expected: item.expected,
                                        },
                                        d.driverName
                                      )
                                    }
                                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-black hover:bg-amber-400 transition cursor-pointer"
                                  >
                                    Cuadrar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setMassTarget({
                              driverId: d.driverId,
                              driverName: d.driverName,
                              count: d.pending.length,
                              toCollect: d.toCollect,
                              toPay: d.toPay,
                            })
                          }
                          className="px-4 py-2 rounded-xl border border-amber-500/40 text-amber-300 text-xs font-black hover:bg-amber-500/10 transition cursor-pointer"
                        >
                          Cuadrar todo ({d.pending.length})
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── HISTORIAL ── */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="flex items-center gap-2 text-sm font-black text-white cursor-pointer"
            >
              <History className="w-4 h-4 text-amber-400" />
              Historial de cuadres ({summary.settledCount})
              <span className="text-slate-500">{showHistory ? "▲" : "▼"}</span>
            </button>
            {showHistory && (
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs text-slate-400 uppercase">
                    <tr>
                      <th className="p-3">Cuadrada</th>
                      <th className="p-3">Domiciliario</th>
                      <th className="p-3"># Orden</th>
                      <th className="p-3">Pago</th>
                      <th className="p-3 text-right">Monto real</th>
                      <th className="p-3 text-right">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data.drivers.flatMap((d) =>
                      d.settled.map((item) => {
                        const diff = (item.settledAmount ?? item.expected) - item.expected;
                        return (
                          <tr key={item.logId} className="hover:bg-slate-800/40 transition">
                            <td className="p-3 text-xs text-slate-400 whitespace-nowrap">
                              {formatDate(item.settledAt)}
                            </td>
                            <td className="p-3 font-bold text-white">{d.driverName}</td>
                            <td className="p-3 font-mono font-bold text-amber-400">
                              #{item.orderId}
                            </td>
                            <td className="p-3">{paymentBadge(item.paymentGroup === "cash" ? "cash" : item.paymentGroup === "transfer" ? "transfer" : null)}</td>
                            <td className="p-3 text-right font-bold text-emerald-400">
                              {formatMoney(item.settledAmount ?? item.expected)}
                            </td>
                            <td
                              className={`p-3 text-right font-bold ${
                                diff === 0 ? "text-slate-500" : diff > 0 ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {diff === 0 ? "Exacto" : `${diff > 0 ? "+" : ""}${formatMoney(diff)}`}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── MODAL CUADRAR ── */}
      {settleTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
          onClick={() => setSettleTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">
                Cuadrar orden #{settleTarget.orderId}
              </h3>
              <button
                type="button"
                onClick={() => setSettleTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-400">
              {settleTarget.driverName} ·{" "}
              {settleTarget.direction === "driver_owes" ? (
                <span className="font-bold text-rose-400">
                  debe entregar {formatMoney(settleTarget.expected)}
                </span>
              ) : settleTarget.direction === "business_owes" ? (
                <span className="font-bold text-sky-400">
                  hay que pagarle {formatMoney(settleTarget.expected)}
                </span>
              ) : (
                <span className="font-bold text-slate-300">sin movimiento esperado</span>
              )}
            </p>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                Monto real {settleTarget.direction === "driver_owes" ? "recibido" : "entregado"}
              </label>
              <input
                type="number"
                min={0}
                step={500}
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-lg font-black text-white outline-none focus:border-amber-400"
              />
              {Number.isFinite(Number(settleAmount)) && settleDiff !== 0 && (
                <p
                  className={`mt-1.5 text-xs font-bold ${
                    settleDiff > 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  Diferencia vs esperado: {settleDiff > 0 ? "+" : ""}
                  {formatMoney(settleDiff)}
                  {settleDiff < 0 ? " (faltante)" : " (sobrante)"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                Nota (opcional)
              </label>
              <input
                type="text"
                value={settleNote}
                onChange={(e) => setSettleNote(e.target.value)}
                placeholder="Ej: entregó $2.000 menos, queda pendiente"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400"
              />
            </div>
            <button
              type="button"
              onClick={confirmSettle}
              disabled={settling}
              className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50 cursor-pointer"
            >
              {settling ? "Cuadrando..." : `Confirmar cuadre · ${formatMoney(Number(settleAmount) || 0)}`}
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL CUADRE MASIVO ── */}
      {massTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
          onClick={() => setMassTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-white">
              Cuadrar todo — {massTarget.driverName}
            </h3>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Órdenes pendientes</span>
                <span className="font-black text-white">{massTarget.count}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Recibir del driver (efectivo)</span>
                <span className="font-black text-rose-400">{formatMoney(massTarget.toCollect)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Pagarle al driver (domicilios)</span>
                <span className="font-black text-sky-400">{formatMoney(massTarget.toPay)}</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                Se cuadra cada orden por su valor esperado (sin diferencias). Si hay un
                faltante, cuadra esa orden individualmente.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMassTarget(null)}
                className="flex-1 rounded-xl border border-slate-700 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmMass}
                disabled={massLoading}
                className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-black text-slate-950 disabled:opacity-50 cursor-pointer"
              >
                {massLoading ? "Cuadrando..." : "Confirmar todo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
