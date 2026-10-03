"use client";

import React from "react";
import { Edit2, Trash2, Plus, Search, ChevronRight } from "lucide-react";

export type CrudColumn<T> = {
  key: keyof T | "actions";
  label: string;
  render?: (item: T) => React.ReactNode;
};

type CrudTableProps<T> = {
  data: T[];
  columns: CrudColumn<T>[];
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  title?: string;
  subtitle?: string;
  addLabel?: string;
};

export function CrudTable<T extends { id: string }>({
  data,
  columns,
  onEdit,
  onDelete,
  onAdd,
  title = "Registros",
  subtitle = "Gestiona la información de este módulo",
  addLabel = "Agregar nuevo",
}: CrudTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((item) => {
      return Object.values(item).some((val) =>
        String(val).toLowerCase().includes(query)
      );
    });
  }, [data, searchQuery]);

  return (
    <div className="w-full bg-slate-900/80 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden transition-colors duration-300">
      <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-950/40">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            {title}
          </h2>
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Buscar registros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-colors"
            />
          </div>

          <button
            onClick={onAdd}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-black bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>{addLabel}</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-150 border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="py-4 px-6 font-medium text-slate-400"
                >
                  {col.label}
                </th>
              ))}
              {/* Actions Header is covered by 'columns' or default actions column */}
              {!columns.some((col) => col.key === "actions") && (
                <th className="py-4 px-6 text-right font-medium">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="py-12 text-center text-slate-500 font-medium"
                >
                  No se encontraron registros.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr
                  key={item.id}
                  className="group hover:bg-slate-800/40 transition-colors duration-150"
                >
                  {columns.map((col) => {
                    if (col.key === "actions") {
                      return (
                        <td key="actions" className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onEdit(item)}
                              aria-label="Editar"
                              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-300 rounded-md transition-all cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => onDelete(item.id)}
                              aria-label="Eliminar"
                              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-md transition-all cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={String(col.key)}
                        className="py-4 px-6 text-slate-300 font-medium align-middle"
                      >
                        {col.render ? (
                          col.render(item)
                        ) : (
                          <span>{String(item[col.key] ?? "")}</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Fallback actions if not added as column */}
                  {!columns.some((col) => col.key === "actions") && (
                    <td className="py-4 px-6 text-right align-middle">
                      <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit(item)}
                          aria-label="Editar"
                          className="p-2 hover:bg-slate-800 text-slate-400 hover:text-amber-300 rounded-lg transition-all cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          aria-label="Eliminar"
                          className="p-2 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-500">
        <span>Mostrando {filteredData.length} registros</span>
        <span className="flex items-center gap-1">
          Página 1 de 1 <ChevronRight size={12} />
        </span>
      </div>
    </div>
  );
}
