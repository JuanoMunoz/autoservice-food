"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, X, Utensils } from "lucide-react";
import { CrudTable, CrudColumn } from "../../_components/CrudTable";
import { ConfirmModal } from "../../_components/ConfirmModal";
import { ImageUploader } from "../../_components/ImageUploader";
import { createProduct, updateProduct, deleteProduct } from "../../_actions/productos";
import { formatCOP, parseCOP } from "@/utils/utils";
import Image from "next/image";
import { Product, Ingredient } from "@/types/Core";

interface ProductosClientProps {
  initialData: Product[];
  availableIngredients: Ingredient[];
}

const columns: CrudColumn<Product>[] = [
  {
    key: "name",
    label: "Producto",
    render: (item) => (
      <div className="flex items-center gap-3">
        {item.imageRoute ? (
          <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950 shrink-0">
            <Image src={item.imageRoute} alt={item.name} fill className="object-contain p-0.5" unoptimized />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg border border-neutral-800 bg-neutral-900 flex items-center justify-center shrink-0">
            <Utensils size={16} className="text-neutral-600" />
          </div>
        )}
        <div>
          <span className="font-semibold text-neutral-200">{item.name}</span>
          <span className="block text-[10px] text-neutral-500 max-w-[200px] truncate">{item.description}</span>
        </div>
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

export function ProductosClient({ initialData, availableIngredients }: ProductosClientProps) {
  const [data, setData] = useState<Product[]>(initialData);
  const [isPending, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<string[]>([]);
  const [imageRoute, setImageRoute] = useState("");
  const [priceStr, setPriceStr] = useState("");

  const computedDescription = availableIngredients
    .filter((i) => selectedIngredientIds.includes(i.id))
    .map((i) => i.name)
    .join(", ");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTarget, setConfirmTarget] = useState("");

  const resetForm = () => {
    setName(""); setSelectedIngredientIds([]); setImageRoute(""); setPriceStr(""); setEditingItem(null);
  };

  const handleOpenAdd = () => { resetForm(); setFormOpen(true); };

  const handleOpenEdit = (item: Product) => {
    setEditingItem(item);
    setName(item.name);
    setSelectedIngredientIds(item.productIngredients?.map(pi => pi.ingredientId) || []);
    setImageRoute(item.imageRoute ?? "");
    const numPrice = typeof item.price === "object" ? item.price.toNumber() : Number(item.price);
    setPriceStr(String(numPrice));
    setFormOpen(true);
  };

  const handleRequestDelete = (id: string) => {
    const item = data.find((s) => s.id === id);
    setConfirmTarget(item?.name ?? "este producto");
    setConfirmAction(() => () => handleConfirmDelete(id));
    setConfirmOpen(true);
  };

  const handleConfirmDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteProduct(id);
        toast.success("Producto eliminado");
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
    if (!name.trim()) {
      toast.error("El nombre es requerido"); return;
    }

    startTransition(async () => {
      try {
        if (editingItem) {
          const updated = await updateProduct(editingItem.id, { 
            name, 
            description: computedDescription, 
            imageRoute: imageRoute || undefined, 
            price, 
            ingredientIds: selectedIngredientIds 
          });
          toast.success("Producto actualizado");
          setData((prev) => prev.map((s) => s.id === editingItem.id
            ? { ...s, ...updated, createdAt: new Date(updated.createdAt), updatedAt: new Date(updated.updatedAt) }
            : s
          ));
        } else {
          const created = await createProduct({ 
            name, 
            description: computedDescription, 
            imageRoute: imageRoute || undefined, 
            price, 
            ingredientIds: selectedIngredientIds 
          });
          toast.success("Producto creado");
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
      <CrudTable<Product>
        title="Catálogo de Productos"
        subtitle="Lista completa de productos principales disponibles"
        addLabel="Nuevo Producto"
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
                <Utensils className="text-blue-500" size={18} />
                {editingItem ? "Editar Producto" : "Nuevo Producto"}
              </h3>
              <button onClick={() => { setFormOpen(false); resetForm(); }} className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Nombre</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Salchipapa Especial, Papas Rellenas..."
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition-colors" required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Ingredientes</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-neutral-900 border border-neutral-800 rounded-lg">
                  {availableIngredients.length === 0 ? (
                    <span className="text-sm text-neutral-500 col-span-2 text-center py-2">No hay ingredientes disponibles</span>
                  ) : (
                    availableIngredients.map((ing) => (
                      <label key={ing.id} className="flex items-center gap-2 cursor-pointer group p-1.5 rounded-md hover:bg-neutral-800 transition-colors">
                        <input
                          type="checkbox"
                          className="rounded border-neutral-700 text-blue-600 focus:ring-blue-500 bg-neutral-950"
                          checked={selectedIngredientIds.includes(ing.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIngredientIds([...selectedIngredientIds, ing.id]);
                            } else {
                              setSelectedIngredientIds(selectedIngredientIds.filter(id => id !== ing.id));
                            }
                          }}
                        />
                        <span className="text-sm text-neutral-300 group-hover:text-neutral-200 truncate">{ing.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Descripción (Auto-generada)</label>
                <textarea value={computedDescription} readOnly
                  placeholder="Selecciona ingredientes arriba para armar la descripción..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-400 cursor-not-allowed resize-none" />
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

              <ImageUploader value={imageRoute} onChange={setImageRoute} label="Imagen del producto" />

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
        title="Eliminar producto"
        description={`¿Eliminar "${confirmTarget}"? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        variant="danger"
      />
    </>
  );
}
