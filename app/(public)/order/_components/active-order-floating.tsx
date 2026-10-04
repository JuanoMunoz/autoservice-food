'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Receipt } from 'lucide-react'
import { useActiveOrders } from '@/app/_hooks/use-active-orders'

export default function ActiveOrderFloating() {
    const router = useRouter()
    const pathname = usePathname()
    const { orders, isLoading } = useActiveOrders()

    if (isLoading || orders.length === 0) return null
    // No estorbar cuando ya está viendo el detalle
    if (pathname?.startsWith('/order/confirmation/')) return null

    const label =
        orders.length === 1 ? `Ver mi pedido #${orders[0].id}` : `Ver mis ${orders.length} pedidos`

    const target =
        orders.length === 1 ? `/order/confirmation/${orders[0].id}` : '/order/my-orders'

    return (
        <button
            type="button"
            onClick={() => router.push(target)}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white pl-4 pr-5 py-3 rounded-full shadow-xl transition-all active:scale-95 cursor-pointer touch-manipulation"
        >
            <span className="relative">
                <Receipt className="w-5 h-5" />
                {orders.length > 1 && (
                    <span className="absolute -top-2 -right-2 bg-secondary text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                        {orders.length}
                    </span>
                )}
            </span>
            <span className="text-sm font-black whitespace-nowrap">{label}</span>
        </button>
    )
}
