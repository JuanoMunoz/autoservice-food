'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Receipt } from 'lucide-react'
import { useActiveOrders } from '@/app/_hooks/use-active-orders'
import { OrderStatusBadge } from '@/app/(public)/order/_components/order-status'
import { formatCurrency } from '@/utils/cartStorage'

export default function MyOrdersClient() {
    const router = useRouter()
    const { orders, isLoading } = useActiveOrders()

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans select-none">
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
                <button
                    type="button"
                    onClick={() => router.push('/order/products')}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-sm transition-all border border-slate-200 cursor-pointer active:scale-95 touch-manipulation flex items-center gap-1.5 font-bold text-xs"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Volver</span>
                </button>
                <h1 className="text-xl font-black text-slate-900 tracking-wide text-center">
                    Mis pedidos
                </h1>
                <div className="w-10" />
            </header>

            <main className="max-w-xl mx-auto p-4 sm:p-6 space-y-4">
                {isLoading ? (
                    <p className="text-center text-sm font-bold text-slate-500 py-10">
                        Buscando tus pedidos activos...
                    </p>
                ) : orders.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-sm p-8 text-center space-y-3 shadow-sm">
                        <Receipt className="w-10 h-10 mx-auto text-slate-300" />
                        <p className="font-black text-slate-900">No tienes pedidos activos</p>
                        <p className="text-sm text-slate-500 font-medium">
                            Cuando hagas una orden aparecerá aquí para que puedas volver a verla aunque
                            salgas por accidente.
                        </p>
                        <button
                            type="button"
                            onClick={() => router.push('/order/products')}
                            className="bg-secondary hover:bg-secondary-hover text-white font-black py-3 px-6 rounded-sm transition-all cursor-pointer text-sm"
                        >
                            Ver menú
                        </button>
                    </div>
                ) : (
                    orders.map((order) => (
                        <button
                            key={order.id}
                            type="button"
                            onClick={() => router.push(`/order/confirmation/${order.id}`)}
                            className="w-full text-left bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden hover:border-secondary transition-colors cursor-pointer"
                        >
                            <div className="p-4 flex items-center justify-between gap-3">
                                <div>
                                    <p className="font-black text-slate-900">Pedido #{order.id}</p>
                                    <p className="text-xs font-bold text-slate-500">
                                        Total {formatCurrency(parseFloat(order.total || '0'))}
                                    </p>
                                </div>
                                <span className="bg-secondary text-white text-xs font-black px-3 py-1.5 rounded-sm shrink-0">
                                    Ver detalle
                                </span>
                            </div>
                            <OrderStatusBadge status={order.status} showDescription={false} />
                        </button>
                    ))
                )}
            </main>
        </div>
    )
}
