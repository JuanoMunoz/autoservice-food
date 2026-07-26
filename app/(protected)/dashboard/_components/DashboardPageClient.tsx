'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { OrderResponse, OrderStatus } from '@/types/Order'
import { updateOrderStatus, cancelOrder, getAllActiveOrders } from '@/app/(public)/order/actions'
import { formatCurrency } from '@/utils/cartStorage'
import { usePrinter } from '@/app/_hooks/use-printer'
import {
    Flame,
    CheckCircle2,
    Trash2,
    Volume2,
    VolumeX,
    Clock,
    MapPin,
    Truck,
    ArrowRight,
    AlertCircle,
    X,
    RefreshCw,
    Printer,
    FileText
} from 'lucide-react'

interface DashboardPageClientProps {
    initialOrders: OrderResponse[]
}

export default function DashboardPageClient({ initialOrders }: DashboardPageClientProps) {
    const { print, isPrinting } = usePrinter()

    const [orders, setOrders] = useState<OrderResponse[]>(initialOrders)
    const [isConnected, setIsConnected] = useState(false)
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [autoPrint, setAutoPrint] = useState(true)
    const [updatingId, setIsUpdatingId] = useState<number | null>(null)
    const [cancelModalOrder, setCancelModalOrder] = useState<OrderResponse | null>(null)
    const [invoiceModalOrder, setInvoiceModalOrder] = useState<OrderResponse | null>(null)
    const [now, setNow] = useState<number>(Date.now())

    const autoPrintRef = useRef(autoPrint)
    useEffect(() => {
        autoPrintRef.current = autoPrint
    }, [autoPrint])

    // Web Audio API for kitchen chime
    const playNotificationSound = useCallback(() => {
        if (!soundEnabled) return
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            osc.type = 'sine'
            osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15) // A5

            gain.gain.setValueAtTime(0.3, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)

            osc.connect(gain)
            gain.connect(ctx.destination)

            osc.start()
            osc.stop(ctx.currentTime + 0.4)
        } catch {
            // Audio context failed or blocked by browser policy
        }
    }, [soundEnabled])

    // Live Timer Ticker every second for KDS elapsed timers
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now())
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    // Polling Handler for Active Orders
    useEffect(() => {
        let isMounted = true

        const fetchActiveOrders = async () => {
            try {
                const activeOrders = await getAllActiveOrders()
                if (!isMounted) return

                setIsConnected(true)

                setOrders((prev) => {
                    const prevIds = new Set(prev.map((o) => o.id))
                    const brandNewOrders = activeOrders.filter((o) => !prevIds.has(o.id))

                    if (brandNewOrders.length > 0 && prev.length > 0) {
                        playNotificationSound()

                        // Auto-print invoice if enabled
                        if (autoPrintRef.current) {
                            const latestNewOrder = brandNewOrders[brandNewOrders.length - 1]
                            setInvoiceModalOrder(latestNewOrder)
                            setTimeout(() => {
                                print()
                            }, 300)
                        }
                    }

                    return activeOrders
                })
            } catch (err) {
                console.error('Error polling active orders:', err)
                if (isMounted) setIsConnected(false)
            }
        }

        // Poll every 3 seconds
        const interval = setInterval(fetchActiveOrders, 3000)

        return () => {
            isMounted = false
            clearInterval(interval)
        }
    }, [playNotificationSound, print])

    // State Transition Handlers
    const handleNextStage = async (order: OrderResponse) => {
        setIsUpdatingId(order.id)
        let nextStatus: OrderStatus = 'PREPARING'

        if (order.status === 'CREATED') nextStatus = 'PREPARING'
        else if (order.status === 'PREPARING') nextStatus = 'DELIVERING'
        else if (order.status === 'DELIVERING') nextStatus = 'COMPLETED'

        try {
            await updateOrderStatus(order.id, nextStatus)
        } catch (err) {
            console.error('Error advancing order stage:', err)
        } finally {
            setIsUpdatingId(null)
        }
    }

    const handleConfirmCancel = async () => {
        if (!cancelModalOrder) return
        setIsUpdatingId(cancelModalOrder.id)
        try {
            await cancelOrder(cancelModalOrder.id)
            setCancelModalOrder(null)
        } catch (err) {
            console.error('Error canceling order:', err)
        } finally {
            setIsUpdatingId(null)
        }
    }

    // Helper to calculate elapsed time in MM:SS
    const getElapsedTime = (createdAt: string) => {
        const createdMs = new Date(createdAt).getTime()
        const diffSecs = Math.max(0, Math.floor((now - createdMs) / 1000))
        const mins = Math.floor(diffSecs / 60)
            .toString()
            .padStart(2, '0')
        const secs = (diffSecs % 60).toString().padStart(2, '0')
        return { formatted: `${mins}:${secs}`, totalMins: Math.floor(diffSecs / 60) }
    }

    // Stage Column Filters (FIFO Sorted by creation time)
    const createdOrders = orders.filter((o) => o.status === 'CREATED')
    const preparingOrders = orders.filter((o) => o.status === 'PREPARING')
    const deliveringOrders = orders.filter((o) => o.status === 'DELIVERING')

    return (
        <div className="space-y-6 font-sans select-none print:p-0">
            {/* Header Controls (Hidden on print) */}
            <div className="p-4 flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-md print:hidden">
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="text-xs font-bold text-slate-300">
                        {isConnected ? 'Cocina en Línea (Polling Activo)' : 'Reconectando a cocina...'}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setAutoPrint(!autoPrint)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                            autoPrint
                                ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-sm'
                                : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-850'
                        }`}
                        title="Imprimir automáticamente la factura cuando llegue un nuevo pedido"
                    >
                        <Printer className="w-4 h-4" />
                        <span>{autoPrint ? 'Auto-Imprimir Facturas ON' : 'Auto-Imprimir OFF'}</span>
                    </button>

                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                            soundEnabled
                                ? 'bg-slate-800 text-stone-200 border-slate-700 hover:bg-slate-700'
                                : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-850'
                        }`}
                        title="Alternar sonido de nuevos pedidos"
                    >
                        {soundEnabled ? <Volume2 className="w-4 h-4 text-stone-200" /> : <VolumeX className="w-4 h-4" />}
                        <span>{soundEnabled ? 'Sonido ON' : 'Mute'}</span>
                    </button>
                </div>
            </div>

            {/* KDS Columns Grid (Hidden on print) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start print:hidden">
                <div className="bg-slate-950/80 rounded-md p-4 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between pb-3 px-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                            <h2 className="text-base font-black text-slate-100 uppercase tracking-wider">
                                Nuevos Pedidos
                            </h2>
                        </div>
                        <span className="bg-amber-400/10 text-amber-300 border border-amber-400/30 px-3 py-0.5 rounded-full text-xs font-black">
                            {createdOrders.length}
                        </span>
                    </div>

                    <div className="space-y-4 max-h-[calc(100vh-20px)] overflow-y-auto py-3 pr-1">
                        {createdOrders.length > 0 ? (
                            createdOrders.map((order) => (
                                <KDSTicketCard
                                    key={order.id}
                                    order={order}
                                    elapsed={getElapsedTime(order.createdAt)}
                                    isUpdating={updatingId === order.id}
                                    onNext={() => handleNextStage(order)}
                                    onCancel={() => setCancelModalOrder(order)}
                                    onOpenInvoice={() => setInvoiceModalOrder(order)}
                                    nextLabel="Iniciar Preparación"
                                />
                            ))
                        ) : (
                            <EmptyColumnMessage text="Sin pedidos pendientes en cola" />
                        )}
                    </div>
                </div>

                <div className="bg-slate-950/80 rounded-md p-4 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between pb-3 px-2">
                        <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-stone-200" />
                            <h2 className="text-base font-black text-slate-100 uppercase tracking-wider">
                                En Preparación
                            </h2>
                        </div>
                        <span className="bg-stone-200/10 text-stone-200 border border-stone-200/30 px-3 py-0.5 rounded-full text-xs font-black">
                            {preparingOrders.length}
                        </span>
                    </div>

                    <div className="space-y-4 max-h-[calc(100vh-20px)] overflow-y-auto py-3 pr-1">
                        {preparingOrders.length > 0 ? (
                            preparingOrders.map((order) => (
                                <KDSTicketCard
                                    key={order.id}
                                    order={order}
                                    elapsed={getElapsedTime(order.createdAt)}
                                    isUpdating={updatingId === order.id}
                                    onNext={() => handleNextStage(order)}
                                    onCancel={() => setCancelModalOrder(order)}
                                    onOpenInvoice={() => setInvoiceModalOrder(order)}
                                    nextLabel="Marcar Listo"
                                />
                            ))
                        ) : (
                            <EmptyColumnMessage text="Ningún plato en cocina actualmente" />
                        )}
                    </div>
                </div>

                <div className="bg-slate-950/80 rounded-md p-4 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between pb-3 px-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <h2 className="text-base font-black text-slate-100 uppercase tracking-wider">
                                Listos / Despacho
                            </h2>
                        </div>
                        <span className="bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 px-3 py-0.5 rounded-full text-xs font-black">
                            {deliveringOrders.length}
                        </span>
                    </div>

                    <div className="space-y-4 max-h-[calc(100vh-20px)] overflow-y-auto pr-1">
                        {deliveringOrders.length > 0 ? (
                            deliveringOrders.map((order) => (
                                <KDSTicketCard
                                    key={order.id}
                                    order={order}
                                    elapsed={getElapsedTime(order.createdAt)}
                                    isUpdating={updatingId === order.id}
                                    onNext={() => handleNextStage(order)}
                                    onCancel={() => setCancelModalOrder(order)}
                                    onOpenInvoice={() => setInvoiceModalOrder(order)}
                                    nextLabel="Entregado / Finalizar"
                                />
                            ))
                        ) : (
                            <EmptyColumnMessage text="No hay pedidos listos para despacho" />
                        )}
                    </div>
                </div>
            </div>

            {/* Cancel Modal (Hidden on print) */}
            {cancelModalOrder && (
                <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2 text-rose-400 font-black">
                                <AlertCircle className="w-6 h-6" />
                                <h3 className="text-lg text-slate-100">Cancelar Orden #{cancelModalOrder.id}</h3>
                            </div>
                            <button
                                onClick={() => setCancelModalOrder(null)}
                                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-slate-300 font-medium leading-relaxed">
                            ¿Confirmas la cancelación de la orden <strong className="text-stone-100">#{cancelModalOrder.id}</strong> del cliente{' '}
                            <strong className="text-stone-100">{cancelModalOrder.buyerName || 'Anónimo'}</strong>?
                        </p>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={() => setCancelModalOrder(null)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 rounded-xl transition-all cursor-pointer"
                            >
                                Mantener Orden
                            </button>
                            <button
                                onClick={handleConfirmCancel}
                                disabled={updatingId === cancelModalOrder.id}
                                className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Sí, Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Printable Receipt Modal */}
            {invoiceModalOrder && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto print:static print:bg-transparent print:p-0 print:m-0">
                    <div className="bg-white border-2 border-slate-300 rounded-sm p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none text-slate-900 font-mono">
                        {/* Modal Action Header (Hidden on print) */}
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
                            <div className="flex items-center gap-2 text-slate-900 font-black">
                                <FileText className="w-5 h-5 text-secondary" />
                                <span className="text-sm uppercase tracking-wide">Comprobante de Venta KDS</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={print}
                                    disabled={isPrinting}
                                    className="bg-secondary hover:bg-secondary-hover text-white px-3 py-1.5 rounded-sm font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span>Imprimir Factura</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInvoiceModalOrder(null)}
                                    className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-sm transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

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
                                    Factura de Venta CP-{invoiceModalOrder.id.toString().padStart(6, '0')}
                                </span>
                            </div>
                        </div>

                        {/* Receipt Meta Info */}
                        <div className="grid grid-cols-2 gap-3 text-xs border-b border-dashed border-slate-300 pb-4">
                            <div>
                                <span className="text-slate-500 font-bold block uppercase text-[10px]">Fecha / Hora</span>
                                <span className="font-black text-slate-900">
                                    {new Date(invoiceModalOrder.createdAt).toLocaleDateString('es-CO')} — {new Date(invoiceModalOrder.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500 font-bold block uppercase text-[10px]">Nº de Orden</span>
                                <span className="font-black text-slate-900">#{invoiceModalOrder.id}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 font-bold block uppercase text-[10px]">Cliente</span>
                                <span className="font-black text-slate-900">{invoiceModalOrder.buyerName || 'Cliente Kiosko'}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 font-bold block uppercase text-[10px]">Tipo de Servicio</span>
                                <span className="font-black text-slate-900">{invoiceModalOrder.onSite ? 'En el local (Para comer)' : 'A domicilio'}</span>
                            </div>
                            {!invoiceModalOrder.onSite && invoiceModalOrder.address && (
                                <div className="col-span-2 pt-1 border-t border-slate-100">
                                    <span className="text-slate-500 font-bold block uppercase text-[10px]">Dirección de Entrega</span>
                                    <span className="font-black text-slate-900 break-words">{invoiceModalOrder.address}</span>
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
                                {invoiceModalOrder.items && invoiceModalOrder.items.length > 0 ? (
                                    invoiceModalOrder.items.map((item) => {
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
                                <span>{formatCurrency(parseFloat(invoiceModalOrder.total))}</span>
                            </div>
                            {!invoiceModalOrder.onSite && (
                                <div className="flex justify-between items-center text-slate-600 font-bold">
                                    <span>Cargo por Domicilio</span>
                                    <span className="text-emerald-700">INCLUIDO</span>
                                </div>
                            )}
                            <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-base font-black text-slate-900">
                                <span>TOTAL A PAGAR</span>
                                <span className="text-xl font-black text-secondary">{formatCurrency(parseFloat(invoiceModalOrder.total))}</span>
                            </div>
                        </div>

                        {/* Receipt Footer Message */}
                        <div className="text-center pt-4 border-t border-dashed border-slate-300 text-[11px] font-semibold text-slate-500 space-y-1">
                            <p className="font-black text-slate-800">¡GRACIAS POR TU COMPRA EN CHEESEPAPAS! 🍟</p>
                            <p>Comprobante generado desde la pantalla de Cocina (KDS).</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

interface KDSTicketCardProps {
    order: OrderResponse
    elapsed: { formatted: string; totalMins: number }
    isUpdating: boolean
    onNext: () => void
    onCancel: () => void
    onOpenInvoice: () => void
    nextLabel: string
}

function KDSTicketCard({
    order,
    elapsed,
    isUpdating,
    onNext,
    onCancel,
    onOpenInvoice,
    nextLabel,
}: KDSTicketCardProps) {
    const isLate = elapsed.totalMins >= 10
    const isWarning = elapsed.totalMins >= 5 && elapsed.totalMins < 10

    const createdTime = new Date(order.createdAt).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
    })

    return (
        <div
            className={`bg-slate-900 border rounded-sm p-4 shadow-lg space-y-3.5 transition-all relative overflow-hidden ${
                isLate
                    ? 'border-rose-500/80 ring-2 ring-rose-500/20'
                    : isWarning
                        ? 'border-amber-500/80'
                        : 'border-slate-800 hover:border-slate-700'
            }`}
        >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-stone-100 tracking-tight">
                            #{order.id}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">({createdTime})</span>
                    </div>
                    {order.buyerName && (
                        <p className="text-xs font-extrabold text-slate-300 mt-0.5 line-clamp-1">
                            Cliente: {order.buyerName}
                        </p>
                    )}
                </div>

                <div className="flex flex-col items-end gap-1">
                    {/* Live Timer Badge */}
                    <div
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black ${
                            isLate
                                ? 'bg-rose-950 text-rose-300 border border-rose-800/60 animate-pulse'
                                : isWarning
                                    ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                                    : 'bg-slate-800 text-stone-200 border border-slate-700'
                        }`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{elapsed.formatted} min</span>
                    </div>

                    {/* Order Type Badge */}
                    <div className="flex items-center gap-1 text-[11px] font-extrabold text-slate-400">
                        {order.onSite ? (
                            <span className="inline-flex items-center gap-1 bg-slate-800/80 text-stone-200 px-2 py-0.5 rounded-full border border-slate-700">
                                <MapPin className="w-3 h-3 text-stone-200" /> En Local
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 bg-slate-800/80 text-stone-200 px-2 py-0.5 rounded-full border border-slate-700">
                                <Truck className="w-3 h-3 text-stone-200" /> Delivery
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* High-Density Items List */}
            <div className="space-y-2.5">
                {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => {
                        const name = item.product?.name || item.drink?.name || 'Ítem'
                        return (
                            <div
                                key={`${item.id}-${idx}`}
                                className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 space-y-1"
                            >
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="font-black text-sm text-slate-100 leading-snug">
                                        <span className="text-stone-200 mr-1.5">{item.quantity}x</span>
                                        {name}
                                    </span>
                                </div>

                                {/* Toppings & Extras */}
                                {item.extras && item.extras.length > 0 && (
                                    <div className="pl-4 space-y-0.5">
                                        {item.extras.map((ex, exIdx) => (
                                            <p key={exIdx} className="text-xs text-stone-300 font-medium flex items-center gap-1">
                                                <span className="text-stone-200 font-bold">+</span> {ex.ingredient.name}
                                            </p>
                                        ))}
                                    </div>
                                )}

                                {/* Sauces */}
                                {item.sauces && item.sauces.length > 0 && (
                                    <div className="pl-4 flex items-center gap-1.5 flex-wrap pt-0.5">
                                        {item.sauces.map((s, sIdx) => (
                                            <span
                                                key={sIdx}
                                                className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-[10px] font-extrabold text-slate-300"
                                            >
                                                <span
                                                    className="w-2 h-2 rounded-full border border-white/20 shrink-0"
                                                    style={{ backgroundColor: s.sauce.hex || '#ffffff' }}
                                                />
                                                {s.sauce.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })
                ) : (
                    <p className="text-xs text-slate-500 italic">Sin detalle de productos</p>
                )}
            </div>

            {/* Total Price & Address if delivery */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                {!order.onSite && order.address ? (
                    <p className="text-slate-400 font-medium line-clamp-1 flex-1 pr-2">
                        Dir: <span className="text-slate-200 font-bold">{order.address}</span>
                    </p>
                ) : (
                    <span className="text-slate-500 font-medium">Consumo presencial</span>
                )}
                <span className="font-black text-stone-200 text-sm shrink-0">
                    {formatCurrency(parseFloat(order.total))}
                </span>
            </div>

            {/* Ticket Action Footer: Invoice Button + Trash Button + Advance Stage */}
            <div className="pt-1 flex items-center gap-2">
                {/* Print/View Invoice Button */}
                <button
                    type="button"
                    onClick={onOpenInvoice}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-stone-200 border border-slate-700 rounded-xl transition-colors cursor-pointer active:scale-95"
                    title="Ver e Imprimir Factura"
                >
                    <Printer className="w-5 h-5 text-amber-400" />
                </button>

                {/* Trash/Cancel Button */}
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isUpdating}
                    className="p-3 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700/80 hover:border-rose-800/60 rounded-xl transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Cancelar pedido"
                >
                    <Trash2 className="w-5 h-5" />
                </button>

                {/* Next Stage Advance Button */}
                <button
                    type="button"
                    onClick={onNext}
                    disabled={isUpdating}
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-slate-950 font-black py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-xs sm:text-sm border border-stone-200"
                >
                    {isUpdating ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <span>{nextLabel}</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}

function EmptyColumnMessage({ text }: { text: string }) {
    return (
        <div className="py-12 px-4 text-center border-2 border-dashed border-slate-800/60 rounded-2xl bg-slate-900/30">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{text}</p>
        </div>
    )
}