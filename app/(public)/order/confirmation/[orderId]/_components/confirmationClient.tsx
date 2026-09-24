'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cancelOrder, getOrderDetail } from '@/app/(public)/order/actions'
import { formatCurrency } from '@/utils/cartStorage'
import { OrderStatus, OrderResponse } from '@/types/Order'
import { OrderStatusBadge, OrderTimeline } from '@/app/(public)/order/_components/order-status'
import { usePrinter } from '@/app/_hooks/use-printer'
import InvoiceReceipt from '@/app/_components/InvoiceReceipt'
import { ArrowLeft, AlertTriangle, X, ShoppingBag, Printer, FileText } from 'lucide-react'

interface ConfirmationClientProps {
    initialOrder: OrderResponse
}

export default function ConfirmationClient({ initialOrder }: ConfirmationClientProps) {
    const router = useRouter()
    const { print, isPrinting } = usePrinter()

    const [order, setOrder] = useState<OrderResponse>(initialOrder)
    const [isCanceling, setIsCanceling] = useState(false)
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // Poll order updates periodically
    useEffect(() => {
        if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
            return
        }

        let isMounted = true

        const pollOrderStatus = async () => {
            try {
                const freshOrder = await getOrderDetail(order.id)
                if (isMounted && freshOrder) {
                    setOrder(freshOrder)
                }
            } catch (err) {
                console.error('Error polling order status:', err)
            }
        }

        const interval = setInterval(pollOrderStatus, 3000)

        return () => {
            isMounted = false
            clearInterval(interval)
        }
    }, [order.id, order.status])

    const handleConfirmCancel = async () => {
        setIsCanceling(true)
        setErrorMessage(null)
        try {
            const updated = await cancelOrder(order.id)
            setOrder(updated as any)
            setShowCancelModal(false)
        } catch (error) {
            console.error('Error canceling order:', error)
            setErrorMessage('No se puede cancelar esta orden en su estado actual.')
        } finally {
            setIsCanceling(false)
        }
    }

    const status = order.status as OrderStatus
    const canCancel = status === 'CREATED' || status === 'PREPARING'
    const orderDate = new Date(order.createdAt)
    const formattedDate = orderDate.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })
    const createdTime = orderDate.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
    })

    const invoiceNumber = `CP-${order.id.toString().padStart(6, '0')}`

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-36 font-sans select-none print:bg-white print:pb-0 print:text-black">
            {/* Header (Hidden on print) */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm print:hidden">
                <button
                    type="button"
                    onClick={() => router.push('/order/products')}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-sm transition-all border border-slate-200 cursor-pointer active:scale-95 touch-manipulation flex items-center gap-1.5 font-bold text-xs"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Volver</span>
                </button>
                <h1 className="text-xl font-black text-slate-900 tracking-wide text-center">
                    Pedido #{order.id}
                </h1>
                <button
                    type="button"
                    onClick={print}
                    disabled={isPrinting}
                    className="p-2.5 bg-secondary hover:bg-secondary-hover text-white rounded-sm transition-all border border-secondary cursor-pointer active:scale-95 touch-manipulation flex items-center gap-1.5 font-bold text-xs shadow-sm"
                >
                    <Printer className="w-5 h-5" />
                    <span className="hidden sm:inline">Imprimir</span>
                </button>
            </header>

            <main className="max-w-xl mx-auto p-4 sm:p-6 space-y-6 print:p-0 print:max-w-none">
                {/* Live Order Status Section (Hidden on print) */}
                <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm space-y-4 print:hidden">
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <OrderStatusBadge status={status} showDescription={true} />
                        <span className="inline-block bg-slate-100 text-slate-900 border border-slate-200 px-3 py-1 rounded-sm text-xs font-black tracking-widest uppercase">
                            Seguimiento en Vivo — Orden #{order.id}
                        </span>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                        <OrderTimeline currentStatus={status} />
                    </div>
                </div>

                {/* Print Button Banner (Hidden on print) */}
                <div className="bg-amber-500/10 border border-secondary/30 rounded-sm p-4 flex items-center justify-between shadow-sm print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-secondary text-white rounded-sm font-black">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-900">Comprobante de Venta</p>
                            <p className="text-xs text-slate-600 font-medium">Imprime o guarda tu factura oficial de compra</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={print}
                        disabled={isPrinting}
                        className="bg-secondary hover:bg-secondary-hover text-white px-3.5 py-2 rounded-sm text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all touch-manipulation"
                    >
                        <Printer className="w-4 h-4" />
                        <span>Imprimir Factura</span>
                    </button>
                </div>

                {/* Invoice / Receipt Printable Card */}
                <InvoiceReceipt order={order} note="Conserva esta factura como comprobante de tu pedido." />
            </main>

            {/* Bottom Actions Bar (Hidden on print) */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-xl print:hidden">
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    <button
                        type="button"
                        onClick={print}
                        disabled={isPrinting}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 font-black py-3.5 px-4 rounded-sm transition-all flex items-center justify-center gap-2 text-sm cursor-pointer active:scale-[0.99] touch-manipulation"
                    >
                        <Printer className="w-5 h-5 text-slate-800" />
                        <span>Imprimir Factura</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push('/order/products')}
                        className="flex-1 bg-secondary hover:bg-secondary-hover text-white font-black py-3.5 px-4 rounded-sm shadow-md transition-all flex items-center justify-center gap-2 text-sm border-2 border-secondary cursor-pointer active:scale-[0.99] touch-manipulation"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        <span>Nuevo Pedido</span>
                    </button>

                    {canCancel && (
                        <button
                            type="button"
                            onClick={() => setShowCancelModal(true)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black py-3.5 px-4 rounded-sm transition-all text-xs cursor-pointer active:scale-[0.99] touch-manipulation"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </div>

            {/* Custom Cancel Confirmation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
                    <div className="bg-white border border-slate-300 rounded-sm p-6 w-full max-w-md shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <div className="flex items-center gap-2 text-rose-600 font-black">
                                <AlertTriangle className="w-6 h-6" />
                                <h3 className="text-lg text-slate-900">Cancelar Pedido</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCancelModal(false)}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-sm transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                            ¿Estás seguro de que deseas cancelar la orden <strong className="text-slate-900">#{order.id}</strong>? Esta acción no se puede deshacer.
                        </p>

                        {errorMessage && (
                            <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-sm border border-rose-200">
                                {errorMessage}
                            </p>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-sm transition-all cursor-pointer touch-manipulation border border-slate-200"
                            >
                                Mantener Pedido
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmCancel}
                                disabled={isCanceling}
                                className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black py-3 rounded-sm transition-all cursor-pointer shadow-sm touch-manipulation"
                            >
                                {isCanceling ? 'Cancelando...' : 'Sí, Cancelar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
