"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, X, Settings } from "lucide-react";
import { CrudTable, CrudColumn } from "../../(core)/_components/CrudTable";
import { ConfirmModal } from "../../(core)/_components/ConfirmModal";
import { createConfiguration, updateConfiguration, deleteConfiguration } from "../../_actions/configuration";
import { Configuration } from "@/types/Core";

interface ConfiguracionClientProps {
  initialData: Configuration[];
}

const columns: CrudColumn<Configuration>[] = [
  {
    key: "name",
    label: "Nombre / Clave",
    render: (item) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg border border-neutral-800 bg-neutral-900 flex items-center justify-center shrink-0">
          <Settings size={16} className="text-neutral-600" />
        </div>
        <div>
          <span className="font-semibold text-neutral-200">{item.name}</span>
          <span className="block text-[10px] text-neutral-500 max-w-[200px] truncate">
            Creado por: {item.createdBy?.name || "Sistema"}
          </span>
        </div>
      </div>
    ),
  },
  {
    key: "value",
    label: "Valor",
    render: (item) => (
      <span className="text-sm text-neutral-300 font-mono bg-neutral-900 px-2 py-1 rounded">
        {item.value}
      </span>
    ),
  },
  {
    key: "createdAt",
    label: "Actualizado",
    render: (item) => (
      <span className="text-xs text-neutral-400">
        {item.updatedAt.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
      </span>
    ),
  },
];

export function ConfiguracionClient({ initialData }: ConfiguracionClientProps) {
  const [data, setData] = useState<Configuration[]>(initialData);
  const [isPending, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Configuration | null>(null);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTarget, setConfirmTarget] = useState("");

  const resetForm = () => {
    setName(""); setValue(""); setEditingItem(null);
  };

  const handleOpenAdd = () => { resetForm(); setFormOpen(true); };

  const handleOpenEdit = (item: Configuration) => {
    setEditingItem(item);
    setName(item.name);
    setValue(item.value);
    setFormOpen(true);
  };

  const handleRequestDelete = (id: string) => {
    const item = data.find((s) => s.id === id);
    setConfirmTarget(item?.name ?? "este registro");
    setConfirmAction(() => () => handleConfirmDelete(id));
    setConfirmOpen(true);
  };

  const handleConfirmDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteConfiguration(id);
        toast.success("Configuración eliminada");
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
    if (!name.trim() || !value.trim()) {
      toast.error("Nombre y valor son requeridos"); return;
    }

    startTransition(async () => {
      try {
        if (editingItem) {
          const updated = await updateConfiguration(editingItem.id, { name, value });
          toast.success("Configuración actualizada");
          setData((prev) => prev.map((s) => s.id === editingItem.id
            ? { ...s, ...updated, createdAt: new Date(updated.createdAt), updatedAt: new Date(updated.updatedAt) }
            : s
          ));
        } else {
          const created = await createConfiguration({ name, value });
          toast.success("Configuración creada");
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
      <CrudTable<Configuration>
        title="Variables de Configuración"
        subtitle="Gestiona los parámetros y configuraciones del sistema"
        addLabel="Nueva Configuración"
        data={data}
        columns={columns}
        onAdd={handleOpenAdd}
        onEdit={handleOpenEdit}
        onDelete={handleRequestDelete}
      />

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#18181b] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50 shrink-0">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="text-blue-500" size={18} />
                {editingItem ? "Editar Configuración" : "Nueva Configuración"}
              </h3>
              <button onClick={() => { setFormOpen(false); resetForm(); }} className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Nombre de la clave</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. TASA_CAMBIO, IMPUESTO..."
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition-colors" required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Valor</label>
                <input type="text" value={value} onChange={(e) => setValue(e.target.value)}
                  placeholder="Valor de la configuración..."
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition-colors" required />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800/60 mt-2">
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
        title="Eliminar registro"
        description={`¿Eliminar "${confirmTarget}"? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        variant="danger"
      />
    </>
  );
}
