"use client";

import React, { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Boxes,
  Package,
  Plus,
  ArrowLeftRight,
  SlidersHorizontal,
  Target,
  Search,
  TrendingDown,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import { FormModal, FormActions, FIELD_LABEL, FIELD_INPUT } from "../../_components/FormModal";
import {
  registerEntry,
  transferStock,
  adjustStock,
  setMinQuantity,
  getInventoryOverview,
  getInventoryMovements,
} from "../../_actions/inventario";
import type {
  InventoryRow,
  InventoryMovementRow,
  StockLocation,
} from "@/types/Core";
import type { MovementType } from "@/lib/generated/prisma/client";

interface InventarioClientProps {
  locations: StockLocation[];
  rows: InventoryRow[];
  initialMovements: InventoryMovementRow[];
}

const MOVEMENT_LABELS: Record<MovementType, string> = {
  INITIAL: "Carga inicial",
  PURCHASE: "Entrada",
  TRANSFER: "Traslado",
  ADJUSTMENT: "Ajuste",
  WASTE: "Merma",
};

const MOVEMENT_STYLES: Record<MovementType, string> = {
  INITIAL: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  PURCHASE: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  TRANSFER: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  ADJUSTMENT: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  WASTE: "bg-rose-500/10 text-rose-300 border-rose-500/20",
};

function formatQty(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString("es-CO", { maximumFractionDigits: 3 });
}

function statusOf(row: InventoryRow) {
  if (row.quantity <= 0) {
    return { label: "Agotado", cls: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (row.minQuantity > 0 && row.quantity <= row.minQuantity) {
    return { label: "Bajo", cls: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
  }
  return { label: "OK", cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
}

export function InventarioClient({
  locations,
  rows,
  initialMovements,
}: InventarioClientProps) {
  const [data, setData] = useState<InventoryRow[]>(rows);
  const [movements, setMovements] = useState<InventoryMovementRow[]>(initialMovements);
  const [activeLocationId, setActiveLocationId] = useState<string>(locations[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const [entryRow, setEntryRow] = useState<InventoryRow | null>(null);
  const [transferRow, setTransferRow] = useState<InventoryRow | null>(null);
  const [adjustRow, setAdjustRow] = useState<InventoryRow | null>(null);
  const [minRow, setMinRow] = useState<InventoryRow | null>(null);

  const [entryQty, setEntryQty] = useState("");
  const [entryReason, setEntryReason] = useState("");
  const [entryNote, setEntryNote] = useState("");

  const [transferQty, setTransferQty] = useState("");
  const [transferToId, setTransferToId] = useState("");
  const [transferNote, setTransferNote] = useState("");

  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustType, setAdjustType] = useState<"ADJUSTMENT" | "WASTE">("ADJUSTMENT");
  const [adjustNote, setAdjustNote] = useState("");

  const [minValue, setMinValue] = useState("");

  const locationRows = useMemo(
    () => data.filter((r) => r.locationId === activeLocationId),
    [data, activeLocationId]
  );

  const filteredRows = useMemo(() => {
    if (!query.trim()) return locationRows;
    const q = query.toLowerCase();
    return locationRows.filter((r) => r.ingredientName.toLowerCase().includes(q));
  }, [locationRows, query]);

  const lowStockCount = useMemo(
    () => locationRows.filter((r) => r.quantity <= 0 || (r.minQuantity > 0 && r.quantity <= r.minQuantity)).length,
    [locationRows]
  );

  const totalTracked = locationRows.length;

  const refresh = async () => {
    const [overview, newMovements] = await Promise.all([
      getInventoryOverview(),
      getInventoryMovements({ limit: 100 }),
    ]);
    setData(overview.rows);
    setMovements(
      newMovements.map((m) => ({ ...m, createdAt: String(m.createdAt) }))
    );
  };

  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      try {
        await fn();
        await refresh();
      } catch (err: unknown) {
        toast.error("Error: " + (err instanceof Error ? err.message : "Desconocido"));
      }
    });

  const openEntry = (row: InventoryRow) => {
    setEntryRow(row);
    setEntryQty("");
    setEntryReason("");
    setEntryNote("");
  };

  const openTransfer = (row: InventoryRow) => {
    setTransferRow(row);
    setTransferQty("");
    setTransferNote("");
    setTransferToId(locations.find((l) => l.id !== row.locationId)?.id ?? "");
  };

  const openAdjust = (row: InventoryRow) => {
    setAdjustRow(row);
    setAdjustQty(String(row.quantity));
    setAdjustReason("");
    setAdjustType("ADJUSTMENT");
    setAdjustNote("");
  };

  const openMin = (row: InventoryRow) => {
    setMinRow(row);
    setMinValue(String(row.minQuantity));
  };

  const submitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryRow) return;
    const qty = Number(entryQty);
    if (!qty || qty <= 0) {
      toast.error("Ingresa una cantidad mayor a 0.");
      return;
    }
    const row = entryRow;
    run(async () => {
      await registerEntry({
        ingredientId: row.ingredientId,
        locationId: row.locationId,
        quantity: qty,
        reason: entryReason || undefined,
        note: entryNote || undefined,
        type: row.quantity <= 0 ? "INITIAL" : "PURCHASE",
      });
      toast.success(`Entrada registrada: +${formatQty(qty)} ${row.unit}`);
      setEntryRow(null);
    });
  };

  const submitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferRow) return;
    const qty = Number(transferQty);
    if (!qty || qty <= 0) {
      toast.error("Ingresa una cantidad mayor a 0.");
      return;
    }
    if (!transferToId) {
      toast.error("Selecciona el destino.");
      return;
    }
    const row = transferRow;
    run(async () => {
      await transferStock({
        ingredientId: row.ingredientId,
        fromLocationId: row.locationId,
        toLocationId: transferToId,
        quantity: qty,
        note: transferNote || undefined,
      });
      toast.success(`Traslado registrado: ${formatQty(qty)} ${row.unit}`);
      setTransferRow(null);
    });
  };

  const submitAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustRow) return;
    const qty = Number(adjustQty);
    if (!Number.isFinite(qty) || qty < 0) {
      toast.error("La cantidad no puede ser negativa.");
      return;
    }
    const row = adjustRow;
    run(async () => {
      await adjustStock({
        ingredientId: row.ingredientId,
        locationId: row.locationId,
        newQuantity: qty,
        reason: adjustReason || undefined,
        type: adjustType,
        note: adjustNote || undefined,
      });
      toast.success("Inventario ajustado");
      setAdjustRow(null);
    });
  };

  const submitMin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!minRow) return;
    const min = Number(minValue);
    if (!Number.isFinite(min) || min < 0) {
      toast.error("El mínimo no puede ser negativo.");
      return;
    }
    const row = minRow;
    run(async () => {
      await setMinQuantity({
        ingredientId: row.ingredientId,
        locationId: row.locationId,
        minQuantity: min,
      });
      toast.success("Stock mínimo actualizado");
      setMinRow(null);
    });
  };

  const activeLocation = locations.find((l) => l.id === activeLocationId);

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Ingredientes</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{totalTracked}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
            <TrendingDown size={12} /> Bajo / agotado
          </p>
          <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? "text-amber-400" : "text-slate-100"}`}>
            {lowStockCount}
          </p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 col-span-2 sm:col-span-1">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Punto activo</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{activeLocation?.name ?? "—"}</p>
        </div>
      </div>

      {/* Tabs de ubicación */}
      <div className="flex items-center gap-2 p-1 bg-slate-900/80 border border-slate-800 rounded-2xl w-fit">
        {locations.map((loc) => {
          const active = loc.id === activeLocationId;
          return (
            <button
              key={loc.id}
              onClick={() => setActiveLocationId(loc.id)}
              className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                active
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {loc.name}
            </button>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="w-full bg-slate-900/80 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-950/40">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <Boxes size={18} className="text-amber-400" />
              Existencias · {activeLocation?.name}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Registra entradas, ajusta conteos físicos o traslada entre puntos.
            </p>
          </div>
          <div className="relative sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Buscar ingrediente..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-175 border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6 font-medium">Ingrediente</th>
                <th className="py-4 px-6 font-medium">Existencia</th>
                <th className="py-4 px-6 font-medium">Mínimo</th>
                <th className="py-4 px-6 font-medium">Estado</th>
                <th className="py-4 px-6 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    No hay ingredientes para mostrar.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const status = statusOf(row);
                  return (
                    <tr key={row.ingredientId} className="group hover:bg-slate-800/40 transition-colors duration-150">
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          {row.imageRoute ? (
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shrink-0">
                              <Image src={row.imageRoute} alt={row.ingredientName} fill className="object-contain p-0.5" unoptimized />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center shrink-0">
                              <Package size={16} className="text-slate-600" />
                            </div>
                          )}
                          <span className="font-semibold text-slate-200">{row.ingredientName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <span className="font-mono text-base font-bold text-slate-100">
                          {formatQty(row.quantity)}
                        </span>
                        <span className="ml-1 text-xs text-slate-500">{row.unit}</span>
                      </td>
                      <td className="py-3 px-6">
                        <button
                          onClick={() => openMin(row)}
                          className="font-mono text-sm text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                          title="Editar mínimo"
                        >
                          {row.minQuantity > 0 ? `${formatQty(row.minQuantity)} ${row.unit}` : "—"}
                        </button>
                      </td>
                      <td className="py-3 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEntry(row)}
                            className="p-2 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition-all cursor-pointer"
                            title="Registrar entrada"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => openAdjust(row)}
                            className="p-2 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-all cursor-pointer"
                            title="Ajustar inventario"
                          >
                            <SlidersHorizontal size={16} />
                          </button>
                          <button
                            onClick={() => openTransfer(row)}
                            disabled={locations.length < 2}
                            className="p-2 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Trasladar a otro punto"
                          >
                            <ArrowLeftRight size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-500">
          Mostrando {filteredRows.length} de {totalTracked} ingredientes en {activeLocation?.name}
        </div>
      </div>

      {/* Historial de movimientos */}
      <div className="w-full bg-slate-900/80 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 bg-slate-950/40">
          <h2 className="text-lg font-bold tracking-tight text-white">Movimientos recientes</h2>
          <p className="text-xs text-slate-400 mt-1">Últimos 100 movimientos de inventario.</p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {movements.length === 0 ? (
            <p className="py-10 text-center text-slate-500 text-sm">Sin movimientos registrados.</p>
          ) : (
            <ul className="divide-y divide-slate-800/60">
              {movements.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${MOVEMENT_STYLES[m.type]}`}>
                      {MOVEMENT_LABELS[m.type]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 truncate">
                        <span className="font-semibold">{m.ingredientName}</span>{" "}
                        <span className="font-mono">
                          {m.type === "ADJUSTMENT" || m.type === "WASTE"
                            ? `${m.quantity > 0 ? "+" : ""}${formatQty(m.quantity)}`
                            : formatQty(m.quantity)}{" "}
                          {m.unit}
                        </span>{" "}
                        <span className="text-slate-400">
                          {m.type === "TRANSFER"
                            ? `${m.fromLocationName} → ${m.toLocationName}`
                            : m.type === "PURCHASE" || m.type === "INITIAL"
                              ? `→ ${m.toLocationName}`
                              : `@ ${m.toLocationName}`}
                        </span>
                      </p>
                      {(m.reason || m.note) && (
                        <p className="text-[11px] text-slate-500 truncate">
                          {[m.reason, m.note].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-slate-400">{m.userName ?? "Sistema"}</p>
                    <p className="text-[10px] text-slate-600">
                      {new Date(m.createdAt).toLocaleString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal: Entrada */}
      <FormModal
        open={!!entryRow}
        onClose={() => setEntryRow(null)}
        title="Registrar entrada"
        icon={<Plus className="text-emerald-400" size={18} />}
        description={entryRow ? `${entryRow.ingredientName} · ${entryRow.locationName}` : undefined}
      >
        <form onSubmit={submitEntry} className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Cantidad ({entryRow?.unit})</label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={entryQty}
              onChange={(e) => setEntryQty(e.target.value)}
              placeholder="0"
              autoFocus
              className={FIELD_INPUT}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Motivo (opcional)</label>
            <input
              type="text"
              value={entryReason}
              onChange={(e) => setEntryReason(e.target.value)}
              placeholder="Compra, donación, devolución..."
              className={FIELD_INPUT}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Nota (opcional)</label>
            <input
              type="text"
              value={entryNote}
              onChange={(e) => setEntryNote(e.target.value)}
              placeholder="Factura, proveedor..."
              className={FIELD_INPUT}
            />
          </div>
          <FormActions onCancel={() => setEntryRow(null)} submitLabel="Registrar" pending={isPending} />
        </form>
      </FormModal>

      {/* Modal: Traslado */}
      <FormModal
        open={!!transferRow}
        onClose={() => setTransferRow(null)}
        title="Trasladar inventario"
        icon={<ArrowLeftRight className="text-sky-400" size={18} />}
        description={transferRow ? `${transferRow.ingredientName} · desde ${transferRow.locationName}` : undefined}
      >
        <form onSubmit={submitTransfer} className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Destino</label>
            <select
              value={transferToId}
              onChange={(e) => setTransferToId(e.target.value)}
              className={`${FIELD_INPUT} cursor-pointer`}
            >
              {locations
                .filter((l) => l.id !== transferRow?.locationId)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Cantidad ({transferRow?.unit})</label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={transferQty}
              onChange={(e) => setTransferQty(e.target.value)}
              placeholder="0"
              className={FIELD_INPUT}
              required
            />
            {transferRow && (
              <span className="text-[10px] text-slate-500">
                Disponible en {transferRow.locationName}: {formatQty(transferRow.quantity)} {transferRow.unit}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Nota (opcional)</label>
            <input
              type="text"
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              placeholder="Motivo del traslado..."
              className={FIELD_INPUT}
            />
          </div>
          <FormActions onCancel={() => setTransferRow(null)} submitLabel="Trasladar" pending={isPending} />
        </form>
      </FormModal>

      {/* Modal: Ajuste */}
      <FormModal
        open={!!adjustRow}
        onClose={() => setAdjustRow(null)}
        title="Ajustar inventario"
        icon={<SlidersHorizontal className="text-amber-400" size={18} />}
        description={adjustRow ? `${adjustRow.ingredientName} · ${adjustRow.locationName}` : undefined}
      >
        <form onSubmit={submitAdjust} className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Tipo de ajuste</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAdjustType("ADJUSTMENT")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold rounded-xl border transition-colors cursor-pointer ${
                  adjustType === "ADJUSTMENT"
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <CheckCircle2 size={15} /> Conteo / corrección
              </button>
              <button
                type="button"
                onClick={() => setAdjustType("WASTE")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold rounded-xl border transition-colors cursor-pointer ${
                  adjustType === "WASTE"
                    ? "bg-rose-500/10 border-rose-500/40 text-rose-300"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <TrendingDown size={15} /> Merma / vencimiento
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Cantidad real ({adjustRow?.unit})</label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              placeholder="0"
              className={FIELD_INPUT}
              required
            />
            {adjustRow && (
              <span className="text-[10px] text-slate-500">
                Existencia actual: {formatQty(adjustRow.quantity)} {adjustRow.unit}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Motivo (opcional)</label>
            <input
              type="text"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="Conteo físico, error de digitación..."
              className={FIELD_INPUT}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Nota (opcional)</label>
            <input
              type="text"
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
              placeholder="Detalle adicional..."
              className={FIELD_INPUT}
            />
          </div>
          <FormActions onCancel={() => setAdjustRow(null)} submitLabel="Ajustar" pending={isPending} />
        </form>
      </FormModal>

      {/* Modal: Stock mínimo */}
      <FormModal
        open={!!minRow}
        onClose={() => setMinRow(null)}
        title="Stock mínimo"
        icon={<Target className="text-amber-400" size={18} />}
        description={minRow ? `${minRow.ingredientName} · ${minRow.locationName}` : undefined}
      >
        <form onSubmit={submitMin} className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Mínimo ({minRow?.unit})</label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              placeholder="0"
              className={FIELD_INPUT}
              required
            />
            <span className="text-[10px] text-slate-500">
              Se alertará cuando la existencia sea igual o menor a este valor.
            </span>
          </div>
          <FormActions onCancel={() => setMinRow(null)} submitLabel="Guardar" pending={isPending} />
        </form>
      </FormModal>
    </div>
  );
}
