"use client";

import React from "react";
import { Loader2, X } from "lucide-react";

export const FIELD_LABEL =
  "text-xs uppercase tracking-wider text-slate-400 font-semibold";
export const FIELD_INPUT =
  "w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-colors";
export const FIELD_BOX =
  "bg-slate-950 border border-slate-800 rounded-xl";

type FormModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  wide?: boolean;
};

/** Shell único de modal-formulario: backdrop (tap fuera cierra), card, header. */
export function FormModal({
  open,
  onClose,
  title,
  icon,
  description,
  children,
  wide = false,
}: FormModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${wide ? "max-w-2xl" : "max-w-lg"} bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {icon}
              {title}
            </h3>
            {description && (
              <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

type FormActionsProps = {
  onCancel: () => void;
  submitLabel: string;
  pending?: boolean;
};

/** Footer estándar: Cancelar + Guardar ámbar. Va dentro del <form>. */
export function FormActions({ onCancel, submitLabel, pending = false }: FormActionsProps) {
  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/60">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2.5 text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors cursor-pointer min-h-11"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-black bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50 min-h-11"
      >
        {pending && <Loader2 className="motion-reduce:animate-none animate-spin" size={14} />}
        {submitLabel}
      </button>
    </div>
  );
}
