"use client";
import { AlertTriangle, Info, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending?: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  isPending = false,
  title = "¿Estás seguro?",
  description = "Esta acción no se puede deshacer.",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
}: ConfirmModalProps) {
  if (!open) return null;

  const colorMap = {
    danger: {
      icon: "text-red-400",
      iconBg: "bg-red-500/10 border border-red-500/20",
      btn: "bg-red-600 hover:bg-red-500 shadow-red-900/30",
    },
    warning: {
      icon: "text-amber-400",
      iconBg: "bg-amber-500/10 border border-amber-500/20",
      btn: "bg-amber-600 hover:bg-amber-500 shadow-amber-900/30",
    },
    info: {
      icon: "text-sky-300",
      iconBg: "bg-sky-500/10 border border-sky-500/20",
      btn: "bg-sky-600 hover:bg-sky-500 shadow-sky-900/30",
    }
  };

  const colors = colorMap[variant];

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm bg-[#18181b] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Body */}
        <div className="p-6 flex flex-col items-center gap-4 text-center">
          <div className={`p-3 rounded-full ${colors.iconBg}`}>
            {variant === 'info' ? (<AlertTriangle className={colors.icon} size={22} />) : (<Info className={colors.icon} size={22} />)}

          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="text-sm text-neutral-400">{description}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all duration-200 cursor-pointer shadow-lg disabled:opacity-50 ${colors.btn}`}
          >
            {isPending && <Loader2 className="animate-spin" size={14} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
