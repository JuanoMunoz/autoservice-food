"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Edit3, Plus, Power, Trash2, X } from "lucide-react";
import { createTable, deleteTable, toggleTable, updateTable } from "../../_actions/tables";

interface TableRow {
    id: string;
    number: number;
    name: string | null;
    active: boolean;
    _count: { orders: number };
}

interface TablesClientProps {
    initialData: TableRow[];
}

export default function TablesClient({ initialData }: TablesClientProps) {
    const [data, setData] = useState(initialData);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<TableRow | null>(null);
    const [number, setNumber] = useState("");
    const [name, setName] = useState("");
    const [isPending, startTransition] = useTransition();

    const openCreate = () => {
        setEditing(null);
        setNumber("");
        setName("");
        setFormOpen(true);
    };

    const openEdit = (table: TableRow) => {
        setEditing(table);
        setNumber(String(table.number));
        setName(table.name ?? "");
        setFormOpen(true);
    };

    const save = () => {
        const parsedNumber = Number(number);
        if (!Number.isInteger(parsedNumber) || parsedNumber < 1) {
            toast.error("Escribe un número de mesa válido");
            return;
        }

        startTransition(async () => {
            try {
                const saved = editing
                    ? await updateTable(editing.id, { number: parsedNumber, name })
                    : await createTable({ number: parsedNumber, name });
                setData((current) => editing
                    ? current.map((item) => item.id === saved.id ? saved : item).sort((a, b) => a.number - b.number)
                    : [...current, saved].sort((a, b) => a.number - b.number));
                setFormOpen(false);
                toast.success(editing ? "Mesa actualizada" : "Mesa creada");
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "No se pudo guardar la mesa");
            }
        });
    };

    const changeStatus = (table: TableRow) => {
        startTransition(async () => {
            try {
                const updated = await toggleTable(table.id, !table.active);
                setData((current) => current.map((item) => item.id === updated.id ? updated : item));
                toast.success(updated.active ? "Mesa activada" : "Mesa desactivada");
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado");
            }
        });
    };

    const remove = (table: TableRow) => {
        if (!window.confirm(`¿Eliminar la mesa ${table.number}?`)) return;
        startTransition(async () => {
            try {
                await deleteTable(table.id);
                setData((current) => current.filter((item) => item.id !== table.id));
                toast.success("Mesa eliminada");
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "No se pudo eliminar la mesa");
            }
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button type="button" onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-amber-400">
                    <Plus className="h-4 w-4" /> Nueva mesa
                </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/40">
                <div className="grid grid-cols-[1fr_1.5fr_1fr_auto] gap-4 border-b border-neutral-800 px-5 py-3 text-xs font-black uppercase tracking-wider text-neutral-500">
                    <span>Mesa</span><span>Nombre</span><span>Estado</span><span>Acciones</span>
                </div>
                {data.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-neutral-500">No hay mesas configuradas.</p>
                ) : data.map((table) => (
                    <div key={table.id} className="grid grid-cols-[1fr_1.5fr_1fr_auto] items-center gap-4 border-b border-neutral-900 px-5 py-4 last:border-b-0">
                        <div><p className="font-black text-neutral-100">Mesa {table.number}</p><p className="text-xs text-neutral-500">{table._count.orders} orden(es)</p></div>
                        <span className="text-sm text-neutral-300">{table.name || "Sin nombre"}</span>
                        <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-black ${table.active ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-neutral-700 bg-neutral-900 text-neutral-500"}`}>
                            {table.active ? "Activa" : "Inactiva"}
                        </span>
                        <div className="flex items-center gap-1">
                            <button type="button" onClick={() => openEdit(table)} className="rounded-md p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white" title="Editar"><Edit3 className="h-4 w-4" /></button>
                            <button type="button" onClick={() => changeStatus(table)} className="rounded-md p-2 text-neutral-400 hover:bg-neutral-800 hover:text-amber-300" title={table.active ? "Desactivar" : "Activar"}><Power className="h-4 w-4" /></button>
                            <button type="button" onClick={() => remove(table)} className="rounded-md p-2 text-neutral-400 hover:bg-neutral-800 hover:text-rose-400" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
                        </div>
                    </div>
                ))}
            </div>

            {formOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-950 p-5 shadow-2xl">
                        <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-black text-white">{editing ? "Editar mesa" : "Nueva mesa"}</h2><button type="button" onClick={() => setFormOpen(false)} className="text-neutral-400 hover:text-white"><X className="h-5 w-5" /></button></div>
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-neutral-300">Número<input value={number} onChange={(event) => setNumber(event.target.value)} type="number" min="1" className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-white outline-none focus:border-amber-400" /></label>
                            <label className="block text-sm font-bold text-neutral-300">Nombre opcional<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Terraza" className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-white outline-none focus:border-amber-400" /></label>
                            <button type="button" disabled={isPending} onClick={save} className="w-full rounded-lg bg-amber-500 px-4 py-2.5 font-black text-slate-950 disabled:opacity-50">{isPending ? "Guardando..." : "Guardar mesa"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
