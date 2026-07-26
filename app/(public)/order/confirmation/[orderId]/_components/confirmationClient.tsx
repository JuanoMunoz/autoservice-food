'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cancelOrder } from '@/app/(public)/order/actions'
import { formatCurrency } from '@/utils/cartStorage'
import { OrderStatus, OrderResponse } from '@/types/Order'
import { OrderStatusBadge, OrderTimeline } from '@/app/(public)/order/_components/order-status'
import { usePrinter } from '@/app/_hooks/use-printer'
import { ArrowLeft, AlertTriangle, X, ShoppingBag, Printer, FileText, CheckCircle2 } from 'lucide-react'

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

    // Listen to SSE live order updates from dashboard
    useEffect(() => {
        const eventSource = new EventSource('/api/events')

        const handleUpdate = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data)
                const updatedId = data.id || data.order?.id
                const newStatus = data.status || data.order?.status

                if (updatedId === order.id && newStatus) {
                    setOrder((prev) => ({
                        ...prev,
                        ...(data.order || {}),
                        status: newStatus as OrderStatus,
                    }))
                }
            } catch (err) {
                console.error('Error parsing SSE order update event:', err)
            }
        }

        eventSource.addEventListener('order-update', handleUpdate)
        eventSource.addEventListener('order-updated', handleUpdate)

        return () => {
            eventSource.close()
        }
    }, [order.id])

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
                <div className="bg-white border-2 border-slate-300 rounded-sm p-6 sm:p-8 shadow-md space-y-6 relative print:shadow-none print:border-none print:p-0 print:w-full font-mono text-slate-900">
                    {/* Top Thermal Receipt Header */}
                    <div className="text-center space-y-1.5 border-b-2 border-dashed border-slate-300 pb-5">
                        <h1 className="font-saira font-extrabold text-3xl tracking-tight text-slate-900">
                            Cheese<span className="text-secondary">Papas</span>
                        </h1>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
                            Autoservicio de Comida Rápida
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500">
                            NIT: 901.458.293-1 | Tel: +57 300 123 4567
                        </p>
                        <div className="pt-2">
                            <span className="inline-block bg-slate-900 text-white font-black text-xs px-3 py-1 rounded-sm uppercase tracking-widest">
                                Factura de Venta {invoiceNumber}
                            </span>
                        </div>
                    </div>

                    {/* Receipt Meta Info */}
                    <div className="grid grid-cols-2 gap-3 text-xs border-b border-dashed border-slate-300 pb-4">
                        <div>
                            <span className="text-slate-500 font-bold block uppercase text-[10px]">Fecha / Hora</span>
                            <span className="font-black text-slate-900">{formattedDate} — {createdTime}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 font-bold block uppercase text-[10px]">Nº de Orden</span>
                            <span className="font-black text-slate-900">#{order.id}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 font-bold block uppercase text-[10px]">Cliente</span>
                            <span className="font-black text-slate-900">{order.buyerName || 'Cliente Kiosko'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 font-bold block uppercase text-[10px]">Tipo de Servicio</span>
                            <span className="font-black text-slate-900">{order.onSite ? 'En el local (Para comer)' : 'A domicilio'}</span>
                        </div>
                        {!order.onSite && order.address && (
                            <div className="col-span-2 pt-1 border-t border-slate-100">
                                <span className="text-slate-500 font-bold block uppercase text-[10px]">Dirección de Entrega</span>
                                <span className="font-black text-slate-900 break-words">{order.address}</span>
                            </div>
                        )}
                    </div>

                    {/* Items Table */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-600 border-b border-slate-300 pb-2">
                            <span>Cant. / Producto</span>
                            <span>Total</span>
                        </div>

                        <div className="space-y-3 divide-y divide-slate-100 text-xs">
                            {order.items && order.items.length > 0 ? (
                                order.items.map((item) => {
                                    const itemName = item.product?.name || item.drink?.name || 'Producto'
                                    const unitPrice = parseFloat(item.unitPrice || '0')
                                    const itemTotal = unitPrice * item.quantity

                                    return (
                                        <div key={item.id} className="pt-2 flex justify-between items-start gap-4">
                                            <div className="space-y-0.5 flex-1">
                                                <div className="flex items-center gap-1.5 font-black text-slate-900 text-sm">
                                                    <span className="text-secondary">{item.quantity}x</span>
                                                    <span>{itemName}</span>
                                                </div>

                                                {/* Toppings / Extras */}
                                                {item.extras && item.extras.length > 0 && (
                                                    <div className="pl-5 text-[11px] text-slate-600 font-medium space-y-0.5">
                                                        {item.extras.map((ex, i) => (
                                                            <div key={i} className="flex justify-between">
                                                                <span>+ {ex.ingredient.name}</span>
                                                                <span className="text-slate-500">{formatCurrency(parseFloat(ex.ingredient.price))}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Sauces */}
                                                {item.sauces && item.sauces.length > 0 && (
                                                    <div className="pl-5 text-[11px] text-slate-500 font-medium">
                                                        <span>Salsas: {item.sauces.map((s) => s.sauce.name).join(', ')}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="text-right shrink-0">
                                                <span className="font-black text-slate-900 text-sm">{formatCurrency(itemTotal)}</span>
                                                <span className="block text-[10px] text-slate-400 font-medium">c/u {formatCurrency(unitPrice)}</span>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <p className="text-slate-500 text-xs italic text-center py-2">Sin productos registrados.</p>
                            )}
                        </div>
                    </div>

                    {/* Financial Totals Breakdown */}
                    <div className="border-t-2 border-dashed border-slate-300 pt-4 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-600 font-bold">
                            <span>Subtotal de Productos</span>
                            <span>{formatCurrency(parseFloat(order.total))}</span>
                        </div>
                        {!order.onSite && (
                            <div className="flex justify-between items-center text-slate-600 font-bold">
                                <span>Cargo por Domicilio</span>
                                <span className="text-emerald-700">INCLUIDO</span>
                            </div>
                        )}
                        <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-base font-black text-slate-900">
                            <span>TOTAL A PAGAR</span>
                            <span className="text-xl font-black text-secondary">{formatCurrency(parseFloat(order.total))}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1">
                            <span>Estado de Pago:</span>
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-black uppercase">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PAGADO
                            </span>
                        </div>
                    </div>

                    {/* Receipt Footer Message */}
                    <div className="text-center pt-4 border-t border-dashed border-slate-300 text-[11px] font-semibold text-slate-500 space-y-1">
                        <p className="font-black text-slate-800">¡GRACIAS POR TU COMPRA EN CHEESEPAPAS! 🍟</p>
                        <p>Conserva esta factura como comprobante de tu pedido.</p>
                        <p className="text-[10px] text-slate-400">www.cheesepapas.com</p>
                    </div>
                </div>
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
