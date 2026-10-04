'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Receipt, X } from 'lucide-react'
import { useActiveOrders } from '@/app/_hooks/use-active-orders'

const SHORT_LABEL: Record<string, string> = {
    CREATED: 'Recibida',
    PREPARING: 'Preparando',
    DELIVERING: 'En camino',
}

export default function ActiveOrderButton() {
    const router = useRouter()
    const { orders, isLoading } = useActiveOrders()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [])

    if (isLoading || orders.length === 0) return null

    if (orders.length === 1) {
        const order = orders[0]
        return (
            <button
                type="button"
                onClick={() => router.push(`/order/confirmation/${order.id}`)}
                className="flex items-center gap-2 px-3.5 py-2 bg-secondary hover:bg-secondary-hover text-white rounded-sm transition-all active:scale-95 shadow-sm cursor-pointer touch-manipulation"
                title={`Ver mi pedido #${order.id}`}
            >
                <Receipt className="w-4 h-4 shrink-0" />
                <span className="text-xs sm:text-sm font-black whitespace-nowrap">
                    Mi pedido #{order.id}
                </span>
                <span className="bg-white/20 text-[10px] font-black uppercase px-2 py-0.5 rounded-sm whitespace-nowrap">
                    {SHORT_LABEL[order.status] ?? 'Activo'}
                </span>
            </button>
        )
    }

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 px-3.5 py-2 bg-secondary hover:bg-secondary-hover text-white rounded-sm transition-all active:scale-95 shadow-sm cursor-pointer touch-manipulation"
                title="Ver mis pedidos activos"
            >
                <Receipt className="w-4 h-4 shrink-0" />
                <span className="text-xs sm:text-sm font-black whitespace-nowrap">
                    Mis pedidos ({orders.length})
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-sm shadow-xl overflow-hidden z-50">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                            Pedidos activos
                        </span>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="p-1 hover:bg-slate-100 rounded-sm cursor-pointer"
                            aria-label="Cerrar"
                        >
                            <X className="w-4 h-4 text-slate-500" />
                        </button>
                    </div>
                    {orders.map((order) => (
                        <button
                            key={order.id}
                            type="button"
                            onClick={() => {
                                setOpen(false)
                                router.push(`/order/confirmation/${order.id}`)
                            }}
                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                        >
                            <span className="text-sm font-black text-slate-900">
                                Pedido #{order.id}
                            </span>
                            <span className="bg-amber-500/10 border border-secondary text-secondary text-[10px] px-2 py-0.5 rounded-sm font-black uppercase">
                                {SHORT_LABEL[order.status] ?? 'Activo'}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
