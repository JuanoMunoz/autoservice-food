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
    <div className="w-full bg-[#18181b] text-neutral-100 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden transition-all duration-300">
      <div className="p-6 border-b border-neutral-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#1e1e24]/50">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            {title}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Buscar registros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 transition-colors"
            />
          </div>

          <button
            onClick={onAdd}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all duration-200 cursor-pointer shadow-lg shadow-blue-900/20 active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>{addLabel}</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-150 border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-[#1e1e24]/30 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
              <th className="py-4 px-6 w-12 text-center">
                <input
                  type="checkbox"
                  disabled
                  className="rounded border-neutral-700 text-blue-600 focus:ring-blue-500 bg-neutral-900 accent-blue-600 cursor-not-allowed opacity-50"
                />
              </th>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="py-4 px-6 font-medium text-neutral-400"
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
          <tbody className="divide-y divide-neutral-800/60">
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="py-12 text-center text-neutral-500 font-medium"
                >
                  No se encontraron registros.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr
                  key={item.id}
                  className="group hover:bg-neutral-900/40 transition-colors duration-150"
                >
                  <td className="py-4 px-6 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-neutral-700 text-blue-600 focus:ring-blue-500 bg-neutral-900 accent-blue-600 cursor-pointer"
                    />
                  </td>
                  {columns.map((col) => {
                    if (col.key === "actions") {
                      return (
                        <td key="actions" className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onEdit(item)}
                              className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-blue-400 rounded-md transition-all cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => onDelete(item.id)}
                              className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 rounded-md transition-all cursor-pointer"
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
                        className="py-4 px-6 text-neutral-300 font-medium align-middle"
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
                          className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-blue-400 rounded-lg transition-all cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 rounded-lg transition-all cursor-pointer"
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
      <div className="p-4 border-t border-neutral-800 bg-[#1e1e24]/20 flex items-center justify-between text-xs text-neutral-500">
        <span>Mostrando {filteredData.length} registros</span>
        <span className="flex items-center gap-1">
          Página 1 de 1 <ChevronRight size={12} />
        </span>
      </div>
    </div>
  );
}
