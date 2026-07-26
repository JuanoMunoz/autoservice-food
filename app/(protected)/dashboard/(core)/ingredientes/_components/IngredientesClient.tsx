"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, X, Package } from "lucide-react";
import { CrudTable, CrudColumn } from "../../_components/CrudTable";
import { ConfirmModal } from "../../_components/ConfirmModal";
import { ImageUploader } from "../../_components/ImageUploader";
import {
    createIngredient,
    updateIngredient,
    deleteIngredient,
} from "../../_actions/ingredientes";
import { formatCOP, parseCOP } from "@/utils/utils";
import { IngredientType } from "@/lib/generated/prisma/client";
import Image from "next/image";
import { Ingredient } from "@/types/Core";

interface IngredientesClientProps {
    initialData: Ingredient[];
}

const TYPE_LABELS: Record<IngredientType, string> = {
    FOOD: "Comida",
    DRINK: "Bebida",
};

const columns: CrudColumn<Ingredient>[] = [
    {
        key: "name",
        label: "Ingrediente",
        render: (item) => (
            <div className="flex items-center gap-3">
                {item.imageRoute ? (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950 shrink-0">
                        <Image src={item.imageRoute} alt={item.name} fill className="object-contain p-0.5" unoptimized />
                    </div>
                ) : (
                    <div className="w-10 h-10 rounded-lg border border-neutral-800 bg-neutral-900 flex items-center justify-center shrink-0">
                        <Package size={16} className="text-neutral-600" />
                    </div>
                )}
                <div>
                    <span className="font-semibold text-neutral-200">{item.name}</span>
                    <span className="block text-[10px] text-neutral-500 max-w-[200px] truncate">
                        {item.description}
                    </span>
                </div>
            </div>
        ),
    },
    {
        key: "type",
        label: "Tipo / Topping",
        render: (item) => (
            <div className="flex flex-col gap-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {TYPE_LABELS[item.type]}
                </span>
                {item.isTopping && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        🍟 Topping
                    </span>
                )}
            </div>
        ),
    },
    {
        key: "price",
        label: "Precio",
        render: (item) => (
            <span className="font-mono text-sm font-semibold text-emerald-400">
                {formatCOP(item.price as number)}
            </span>
        ),
    },
    {
        key: "createdAt",
        label: "Creado",
        render: (item) => (
            <span className="text-xs text-neutral-400">
                {item.createdAt.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
        ),
    },
];

export function IngredientesClient({ initialData }: IngredientesClientProps) {
    const [data, setData] = useState<Ingredient[]>(initialData);
    const [isPending, startTransition] = useTransition();

    const [formOpen, setFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Ingredient | null>(null);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [imageRoute, setImageRoute] = useState("");
    const [priceStr, setPriceStr] = useState("");
    const [type, setType] = useState<IngredientType>("FOOD");
    const [isTopping, setIsTopping] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
    const [confirmTarget, setConfirmTarget] = useState("");

    const resetForm = () => {
        setName(""); setDescription(""); setImageRoute("");
        setPriceStr(""); setType("FOOD"); setIsTopping(false);
        setEditingItem(null);
    };

    const handleOpenAdd = () => { resetForm(); setFormOpen(true); };

    const handleOpenEdit = (item: Ingredient) => {
        setEditingItem(item);
        setName(item.name);
        setDescription(item.description);
        setImageRoute(item.imageRoute ?? "");
        const numPrice = typeof item.price === "object" ? item.price.toNumber() : Number(item.price);
        setPriceStr(String(numPrice));
        setType(item.type);
        setIsTopping(item.isTopping);
        setFormOpen(true);
    };

    const handleRequestDelete = (id: string) => {
        const item = data.find((s) => s.id === id);
        setConfirmTarget(item?.name ?? "este ingrediente");
        setConfirmAction(() => () => handleConfirmDelete(id));
        setConfirmOpen(true);
    };

    const handleConfirmDelete = (id: string) => {
        startTransition(async () => {
            try {
                await deleteIngredient(id);
                toast.success("Ingrediente eliminado");
                setData((prev) => prev.filter((s) => s.id !== id));
            } catch (err: unknown) {
                toast.error("Error: " + (err instanceof Error ? err.message : "Desconocido"));
            } finally {
                setConfirmOpen(false);
                setConfirmAction(null);
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const price = parseCOP(priceStr);
        if (!name.trim() || !description.trim()) {
            toast.error("Nombre y descripción son requeridos"); return;
        }

        startTransition(async () => {
            try {
                if (editingItem) {
                    const updated = await updateIngredient(editingItem.id, { name, description, imageRoute: imageRoute || undefined, price, type, isTopping });
                    toast.success("Ingrediente actualizado");
                    setData((prev) => prev.map((s) => s.id === editingItem.id
                        ? { ...s, ...updated, createdAt: new Date(updated.createdAt), updatedAt: new Date(updated.updatedAt) }
                        : s
                    ));
                } else {
                    const created = await createIngredient({ name, description, imageRoute: imageRoute || undefined, price, type, isTopping });
                    toast.success("Ingrediente creado");
                    setData((prev) => [{ ...created, createdAt: new Date(created.createdAt), updatedAt: new Date(created.updatedAt) }, ...prev]);
                }
                setFormOpen(false);
                resetForm();
            } catch (err: unknown) {
                toast.error("Error: " + (err instanceof Error ? err.message : "Desconocido"));
            }
        });
    };

    return (
        <>
            <CrudTable<Ingredient>
                title="Catálogo de Ingredientes"
                subtitle="Lista completa de ingredientes y toppings"
                addLabel="Nuevo Ingrediente"
                data={data}
                columns={columns}
                onAdd={handleOpenAdd}
                onEdit={handleOpenEdit}
                onDelete={handleRequestDelete}
            />

            {formOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-lg bg-[#18181b] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50 shrink-0">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Package className="text-blue-500" size={18} />
                                {editingItem ? "Editar Ingrediente" : "Nuevo Ingrediente"}
                            </h3>
                            <button onClick={() => { setFormOpen(false); resetForm(); }} className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Nombre</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej. Tomate, Queso cheddar..."
                                    className="w-full px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition-colors" required />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Descripción</label>
                                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Descripción breve del ingrediente..."
                                    rows={2}
                                    className="w-full px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition-colors resize-none" required />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Precio (COP)</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-neutral-500 font-semibold">$</span>
                                    <input type="number" value={priceStr} onChange={(e) => setPriceStr(e.target.value)}
                                        placeholder="0" min={0}
                                        className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition-colors" required />
                                </div>
                                {priceStr && <span className="text-[10px] text-emerald-400">{formatCOP(priceStr)}</span>}
                            </div>

                            <div className="flex gap-3">
                                <div className="flex flex-col gap-1.5 flex-1">
                                    <label className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Tipo</label>
                                    <select value={type} onChange={(e) => setType(e.target.value as IngredientType)}
                                        className="w-full px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-neutral-700 transition-colors cursor-pointer">
                                        <option value="FOOD">Comida</option>
                                        <option value="DRINK">Bebida</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1.5 justify-end">
                                    <label className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Topping</label>
                                    <label className="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg cursor-pointer hover:border-neutral-700 transition-colors">
                                        <input type="checkbox" checked={isTopping} onChange={(e) => setIsTopping(e.target.checked)}
                                            className="rounded border-neutral-700 accent-amber-500 cursor-pointer" />
                                        <span className="text-sm text-neutral-300">Es topping</span>
                                    </label>
                                </div>
                            </div>

                            <ImageUploader value={imageRoute} onChange={setImageRoute} label="Imagen del ingrediente" />

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800/60">
                                <button type="button" onClick={() => { setFormOpen(false); resetForm(); }}
                                    className="px-4 py-2.5 text-sm font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg transition-colors cursor-pointer">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isPending}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all cursor-pointer shadow-lg shadow-blue-900/20 disabled:opacity-50">
                                    {isPending && <Loader2 className="animate-spin" size={14} />}
                                    {editingItem ? "Actualizar" : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={confirmOpen}
                onClose={() => { setConfirmOpen(false); setConfirmAction(null); }}
                onConfirm={() => confirmAction?.()}
                isPending={isPending}
                title="Eliminar ingrediente"
                description={`¿Eliminar "${confirmTarget}"? Esta acción no se puede deshacer.`}
                confirmLabel="Sí, eliminar"
                variant="danger"
            />
        </>
    );
}
