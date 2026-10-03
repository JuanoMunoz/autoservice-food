"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { Utensils } from "lucide-react";
import { CrudTable, CrudColumn } from "../../_components/CrudTable";
import { ConfirmModal } from "../../_components/ConfirmModal";
import { FormActions, FormModal } from "../../_components/FormModal";
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
          <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 shrink-0">
            <Image src={item.imageRoute} alt={item.name} fill className="object-contain p-0.5" unoptimized />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center shrink-0">
            <Utensils size={16} className="text-slate-600" />
          </div>
        )}
        <div>
          <span className="font-semibold text-slate-200">{item.name}</span>
          <span className="block text-[10px] text-slate-500 max-w-[200px] truncate">{item.description}</span>
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
      <span className="text-xs text-slate-400">
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

      <FormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); resetForm(); }}
        title={editingItem ? "Editar Producto" : "Nuevo Producto"}
        icon={<Utensils className="text-amber-400" size={18} />}
      >
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Nombre</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Salchipapa Especial, Papas Rellenas..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-colors" required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Ingredientes</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-xl">
                  {availableIngredients.length === 0 ? (
                    <span className="text-sm text-slate-500 col-span-2 text-center py-2">No hay ingredientes disponibles</span>
                  ) : (
                    availableIngredients.map((ing) => (
                      <label key={ing.id} className="flex items-center gap-2 cursor-pointer group p-1.5 rounded-md hover:bg-slate-800 transition-colors">
                        <input
                          type="checkbox"
                          className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-950"
                          checked={selectedIngredientIds.includes(ing.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIngredientIds([...selectedIngredientIds, ing.id]);
                            } else {
                              setSelectedIngredientIds(selectedIngredientIds.filter(id => id !== ing.id));
                            }
                          }}
                        />
                        <span className="text-sm text-slate-300 group-hover:text-slate-200 truncate">{ing.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Descripción (Auto-generada)</label>
                <textarea value={computedDescription} readOnly
                  placeholder="Selecciona ingredientes arriba para armar la descripción..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-400 cursor-not-allowed resize-none" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Precio (COP)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-semibold">$</span>
                  <input type="number" value={priceStr} onChange={(e) => setPriceStr(e.target.value)}
                    placeholder="0" min={0}
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-colors" required />
                </div>
                {priceStr && <span className="text-[10px] text-emerald-400">{formatCOP(priceStr)}</span>}
              </div>

              <ImageUploader value={imageRoute} onChange={setImageRoute} label="Imagen del producto" />

              <FormActions
                onCancel={() => { setFormOpen(false); resetForm(); }}
                submitLabel={editingItem ? "Actualizar" : "Guardar"}
                pending={isPending}
              />
            </form>
      </FormModal>

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
