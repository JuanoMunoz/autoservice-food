"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Flame, X } from "lucide-react";
import { CrudTable, CrudColumn } from "../../_components/CrudTable";
import { ConfirmModal } from "../../_components/ConfirmModal";
import { createSauce, updateSauce, deleteSauce } from "../../_actions/salsas";
import { Sauce } from "@/types/Core";

interface SalsasClientProps {
  initialData: Sauce[];
}

const quickColors = [
  "#e63946",
  "#f77f00",
  "#fcbf49",
  "#588157",
  "#457b9d",
  "#7209b7",
  "#f15bb5",
  "#212529",
];

const columns: CrudColumn<Sauce>[] = [
  {
    key: "name",
    label: "Nombre de la Salsa",
    render: (item) => (
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border border-neutral-700/50 flex items-center justify-center shrink-0 shadow-inner"
          style={{ backgroundColor: item.hex }}
        />
        <div>
          <span className="font-semibold text-neutral-200">{item.name}</span>
          <span className="block text-[10px] text-neutral-500">
            Creado por: {item.createdBy?.name || "Sistema"}
          </span>
        </div>
      </div>
    ),
  },
  {
    key: "hex",
    label: "Código Color (HEX)",
    render: (item) => (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-neutral-400 bg-neutral-900/60 border border-neutral-800 px-2 py-1 rounded">
          {item.hex.toUpperCase()}
        </span>
        <span
          className="w-3.5 h-3.5 rounded-sm border border-neutral-800"
          style={{ backgroundColor: item.hex }}
        />
      </div>
    ),
  },
  {
    key: "createdAt",
    label: "Fecha de Creación",
    render: (item) => (
      <span className="text-xs text-neutral-400">
        {item.createdAt.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </span>
    ),
  },
];

export function SalsasClient({ initialData }: SalsasClientProps) {
  const [data, setData] = useState<Sauce[]>(initialData);
  const [isPending, startTransition] = useTransition();

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Sauce | null>(null);
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#ff0000");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<string>("");

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName("");
    setHex("#e63946");
    setFormOpen(true);
  };

  const handleOpenEdit = (item: Sauce) => {
    setEditingItem(item);
    setName(item.name);
    setHex(item.hex);
    setFormOpen(true);
  };

  const handleRequestDelete = (id: string) => {
    const item = data.find((s) => s.id === id);
    setConfirmTarget(item?.name ?? "esta salsa");
    setConfirmAction(() => () => handleConfirmDelete(id));
    setConfirmOpen(true);
  };

  const handleConfirmDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteSauce(id);
        toast.success("Salsa eliminada con éxito");
        setData((prev) => prev.filter((s) => s.id !== id));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Desconocido";
        toast.error("Error al eliminar salsa: " + message);
      } finally {
        setConfirmOpen(false);
        setConfirmAction(null);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("El nombre de la salsa es requerido");
      return;
    }
    if (!hex.trim() || !/^#[0-9A-F]{6}$/i.test(hex)) {
      toast.error("Introduce un color hexadecimal válido (ej. #FF0000)");
      return;
    }

    startTransition(async () => {
      try {
        if (editingItem) {
          const updated = await updateSauce(editingItem.id, { name, hex });
          toast.success("Salsa actualizada con éxito");
          setData((prev) =>
            prev.map((s) =>
              s.id === editingItem.id
                ? {
                  ...s,
                  ...updated,
                  createdAt: new Date(updated.createdAt),
                  updatedAt: new Date(updated.updatedAt),
                }
                : s
            )
          );
        } else {
          const created = await createSauce({ name, hex });
          toast.success("Salsa creada con éxito");
          setData((prev) => [
            {
              ...created,
              createdAt: new Date(created.createdAt),
              updatedAt: new Date(created.updatedAt),
            },
            ...prev,
          ]);
        }
        setFormOpen(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Desconocido";
        toast.error("Error al guardar salsa: " + message);
      }
    });
  };

  return (
    <>
      <CrudTable<Sauce>
        title="Catálogo de Salsas"
        subtitle="Lista completa de salsas disponibles"
        addLabel="Nueva Salsa"
        data={data}
        columns={columns}
        onAdd={handleOpenAdd}
        onEdit={handleOpenEdit}
        onDelete={handleRequestDelete}
      />

      {/* Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-[#18181b] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Flame className="text-blue-500" size={18} />
                {editingItem ? "Editar Salsa" : "Agregar Nueva Salsa"}
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                  Nombre de la salsa
                </label>
                <input
                  type="text"
                  placeholder="Ej. Salsa rosada, maíz..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                  Color Identificador (HEX)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="#FF0000"
                      value={hex}
                      onChange={(e) => setHex(e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 text-sm font-mono bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition-colors"
                      required
                    />
                    <div
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-neutral-700 shadow-inner"
                      style={{ backgroundColor: hex }}
                    />
                  </div>


                  <div className="relative w-11 h-11 shrink-0 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:border-neutral-700 transition-colors">
                    <input
                      type="color"
                      value={hex}
                      onChange={(e) => setHex(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <span
                      className="w-6 h-6 rounded-full border border-neutral-800"
                      style={{ backgroundColor: hex }}
                    />
                  </div>
                </div>


                <div className="mt-2 flex flex-col gap-1.5">
                  <span className="text-[10px] text-neutral-500 font-medium">Colores sugeridos</span>
                  <div className="flex flex-wrap gap-2">
                    {quickColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setHex(color)}
                        className={`w-6 h-6 rounded-full border cursor-pointer transition-transform hover:scale-110 active:scale-95 ${hex.toLowerCase() === color.toLowerCase()
                          ? "border-white ring-2 ring-blue-500 scale-105"
                          : "border-neutral-800"
                          }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-neutral-800/60">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all duration-200 cursor-pointer shadow-lg shadow-blue-900/20 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="animate-spin" size={14} />}
                  <span>{editingItem ? "Actualizar" : "Guardar Salsa"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmAction(null);
        }}
        onConfirm={() => confirmAction?.()}
        isPending={isPending}
        title="Eliminar salsa"
        description={`¿Estás seguro de que deseas eliminar "${confirmTarget}"? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        variant="danger"
      />
    </>
  );
}
