'use client'

import { ArrowLeftRight, Banknote, Send } from 'lucide-react'
import type { PaymentType } from '@/types/Order'
import { formatCurrency } from '@/utils/cartStorage'

interface PaymentSplitPickerProps {
    method: PaymentType
    onMethodChange: (method: PaymentType) => void
    cashAmount: string
    transferAmount: string
    onCashAmountChange: (value: string) => void
    onTransferAmountChange: (value: string) => void
    total: number
    /** Opcional: campo "Paga con" y cambio (solo se muestra en efectivo) */
    pagaCon?: string
    onPagaConChange?: (value: string) => void
}

const digitsOnly = (value: string) => value.replace(/[^0-9]/g, '').slice(0, 9)

/** Selector de pago reutilizable en crear/editar pedidos y al despachar. */
export default function PaymentSplitPicker({
    method,
    onMethodChange,
    cashAmount,
    transferAmount,
    onCashAmountChange,
    onTransferAmountChange,
    total,
    pagaCon,
    onPagaConChange,
}: PaymentSplitPickerProps) {
    const cash = Number(cashAmount) || 0
    const transfer = Number(transferAmount) || 0
    const diff = cash + transfer - total
    const paidWith = Number(digitsOnly(pagaCon || '')) || 0
    const cambio = paidWith > 0 ? paidWith - total : null

    const optionClass = (active: boolean, activeCls: string) =>
        `flex min-h-12 items-center justify-center gap-1 rounded-xl border px-1 text-[10px] font-black cursor-pointer transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-amber-400 sm:gap-1.5 sm:px-2 sm:text-xs ${
            active ? activeCls : 'border-slate-700 bg-slate-950 text-slate-400 hover:bg-slate-800'
        }`

    return (
        <div className="space-y-2">
            <p id="pay-label" className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Método de pago</p>
            <div className="grid grid-cols-3 gap-1 sm:gap-2" role="radiogroup" aria-labelledby="pay-label">
                <button
                    type="button"
                    role="radio"
                    aria-checked={method === 'cash'}
                    onClick={() => onMethodChange('cash')}
                    className={optionClass(method === 'cash', 'border-emerald-400 bg-emerald-500 text-slate-950 shadow-md')}
                >
                    <Banknote className="h-4 w-4" aria-hidden="true" /> Efectivo
                </button>
                <button
                    type="button"
                    role="radio"
                    aria-checked={method === 'transfer'}
                    onClick={() => onMethodChange('transfer')}
                    className={optionClass(method === 'transfer', 'border-sky-400 bg-sky-500 text-slate-950 shadow-md')}
                >
                    <Send className="h-4 w-4" aria-hidden="true" /> Transferencia
                </button>
                <button
                    type="button"
                    role="radio"
                    aria-checked={method === 'split'}
                    onClick={() => onMethodChange('split')}
                    className={optionClass(method === 'split', 'border-amber-400 bg-amber-500 text-slate-950 shadow-md')}
                >
                    <ArrowLeftRight className="h-4 w-4" aria-hidden="true" /> Dividido
                </button>
            </div>

            {method === 'split' && (
                <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label htmlFor="split-cash" className="mb-1 block text-xs font-bold text-emerald-300">Efectivo $</label>
                            <input
                                id="split-cash"
                                value={cashAmount}
                                onChange={(e) => onCashAmountChange(digitsOnly(e.target.value))}
                                inputMode="numeric"
                                placeholder="0"
                                className="min-h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-base font-black text-white outline-none focus:border-amber-400"
                            />
                        </div>
                        <div>
                            <label htmlFor="split-transfer" className="mb-1 block text-xs font-bold text-sky-300">Transferencia $</label>
                            <input
                                id="split-transfer"
                                value={transferAmount}
                                onChange={(e) => onTransferAmountChange(digitsOnly(e.target.value))}
                                inputMode="numeric"
                                placeholder="0"
                                className="min-h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-base font-black text-white outline-none focus:border-amber-400"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold" role="status">
                        <span className="text-slate-400">Suma {formatCurrency(cash + transfer)}</span>
                        <span className={diff === 0 ? 'text-emerald-300' : 'text-rose-300'}>
                            {diff === 0 ? `= ${formatCurrency(total)} ✓` : `${diff > 0 ? 'Sobra' : 'Faltan'} ${formatCurrency(Math.abs(diff))}`}
                        </span>
                    </div>
                </div>
            )}

            {method === 'cash' && onPagaConChange && (
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <label htmlFor="paga-con" className="mb-1 block text-xs font-bold text-slate-400">Paga con (opcional)</label>
                        <input
                            id="paga-con"
                            value={pagaCon ?? ''}
                            onChange={(e) => onPagaConChange(digitsOnly(e.target.value))}
                            placeholder="Ej: 50000"
                            inputMode="numeric"
                            className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-base text-white outline-none focus:border-amber-400"
                        />
                    </div>
                    <div className="flex-1 rounded-xl bg-slate-950 p-2 text-center" aria-live="polite">
                        <p className="text-[11px] font-bold uppercase text-slate-500">Cambio</p>
                        <p className={`text-lg font-black ${cambio !== null && cambio >= 0 ? 'text-emerald-300' : 'text-slate-400'}`}>
                            {cambio === null ? '—' : cambio >= 0 ? formatCurrency(cambio) : `Faltan ${formatCurrency(-cambio)}`}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
