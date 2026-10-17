'use client'

import Image from 'next/image'
import { OrderResponse } from '@/types/Order'
import { formatCurrency } from '@/utils/cartStorage'

interface InvoiceReceiptProps {
    order: OrderResponse
    note?: string
}

export default function InvoiceReceipt({ order, note }: InvoiceReceiptProps) {
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
    const totalNum = parseFloat(order.total || '0') || 0
    const deliveryFeeNum = parseFloat(order.deliveryFee || '0') || 0
    const subtotalNum = order.onSite ? totalNum : Math.max(0, totalNum - deliveryFeeNum)
    const paymentLabel =
        order.paymentMethod === 'cash' ? 'EFECTIVO'
            : order.paymentMethod === 'transfer' ? 'TRANSFERENCIA'
                : 'NO REGISTRADO'

    return (
        <div className="bg-white border-2 border-slate-300 rounded-sm p-6 sm:p-8 shadow-md space-y-6 relative print:shadow-none print:border-none print:p-0 print:w-full font-mono text-slate-900">
            {/* Top Thermal Receipt Header */}
            <div className="text-center space-y-2 border-b-2 border-dashed border-slate-300 pb-5 flex flex-col items-center">
                <Image
                    src="/logo-cheesepapas.webp"
                    alt="CheesePapas Logo"
                    width={140}
                    height={140}
                    className="mx-auto h-20 w-auto object-contain mb-1"
                    priority
                    unoptimized
                />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
                    Autoservicio de Comida Rápida
                </p>
                <div className="pt-1">
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
                {order.buyerPhone && (
                    <div>
                        <span className="text-slate-500 font-bold block uppercase text-[10px]">Teléfono Cliente</span>
                        <span className="font-black text-slate-900">{order.buyerPhone}</span>
                    </div>
                )}
                <div>
                    <span className="text-slate-500 font-bold block uppercase text-[10px]">Tipo de Servicio</span>
                    <span className="font-black text-slate-900">{order.onSite ? 'En el local (Para comer)' : 'A domicilio'}</span>
                </div>
                {order.onSite && order.serveAtTable != null && (
                    <div>
                        <span className="text-slate-500 font-bold block uppercase text-[10px]">Entrega</span>
                        <span className="font-black text-slate-900">{order.serveAtTable ? 'Entregar en mesa' : 'Entregar para llevar'}</span>
                    </div>
                )}
                {order.table && (
                    <div>
                        <span className="text-slate-500 font-bold block uppercase text-[10px]">Mesa</span>
                        <span className="font-black text-slate-900">
                            {order.table.name || `Mesa ${order.table.number}`}
                        </span>
                    </div>
                )}
                {!order.onSite && (order.address || order.addressReference || order.buyerPhone) && (
                    <div className="col-span-2 pt-1 border-t border-slate-100 space-y-1">
                        {order.address && (
                            <div>
                                <span className="text-slate-500 font-bold block uppercase text-[10px]">Dirección de Entrega</span>
                                <span className="font-black text-slate-900 break-words [overflow-wrap:anywhere] whitespace-pre-wrap">{order.address}</span>
                            </div>
                        )}
                        {order.addressReference && (
                            <div>
                                <span className="text-slate-500 font-bold block uppercase text-[10px]">Barrio / Referencia</span>
                                <span className="font-bold text-slate-800 break-words [overflow-wrap:anywhere] whitespace-pre-wrap">{order.addressReference}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Items Table */}
            <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-600 border-b border-slate-300 pb-2">
                    <span>Cant. / Producto</span>
                    <span>Total</span>
                </div>

                <div className="space-y-3 divide-y divide-slate-100 text-sm">
                    {order.items && order.items.length > 0 ? (
                        order.items.map((item) => {
                            const itemName = item.product?.name || item.drink?.name || 'Producto'
                            const unitPrice = parseFloat(item.unitPrice || '0')
                            const itemTotal = unitPrice * item.quantity

                            return (
                                <div key={item.id} className="pt-2 flex justify-between items-start gap-4">
                                    <div className="space-y-0.5 flex-1">
                                        <div className="flex items-center gap-1.5 font-black text-slate-900 text-base">
                                            <span className="text-secondary">{item.quantity}x</span>
                                            <span>{itemName}</span>
                                        </div>

                                        {/* Toppings / Extras */}
                                        {item.extras && item.extras.length > 0 && (
                                            <div className="pl-5 text-xs text-slate-600 font-medium space-y-0.5">
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
                                            <div className="pl-5 text-xs text-slate-500 font-medium break-words">
                                                <span>Salsas: {item.sauces.map((s) => s.sauce.name).join(', ')}</span>
                                            </div>
                                        )}

                                        {/* Nota por ítem */}
                                        {item.note && (
                                            <div className="pl-5 text-xs font-bold text-slate-700 break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
                                                <span>Nota: {item.note}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-right shrink-0">
                                        <span className="font-black text-slate-900 text-base">{formatCurrency(itemTotal)}</span>
                                        <span className="block text-xs text-slate-400 font-medium">c/u {formatCurrency(unitPrice)}</span>
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
                    <span>{formatCurrency(subtotalNum)}</span>
                </div>
                {!order.onSite && (
                    <div className="flex justify-between items-center text-slate-600 font-bold">
                        <span>Cargo por Domicilio</span>
                        <span>{formatCurrency(deliveryFeeNum)}</span>
                    </div>
                )}
                <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-base font-black text-slate-900">
                    <span>TOTAL A PAGAR</span>
                    <span className="text-xl font-black text-secondary">{formatCurrency(totalNum)}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-1">
                    <span>Método de Pago:</span>
                    <span className="font-black uppercase text-slate-900">{paymentLabel}</span>
                </div>
            </div>

            {/* Observaciones generales (solo si existen) */}
            {order.notes && (
                <div className="border-t border-dashed border-slate-300 pt-3 text-xs">
                    <span className="text-slate-500 font-bold block uppercase text-[10px]">Observaciones</span>
                    <p className="font-bold text-slate-900 break-words [overflow-wrap:anywhere] whitespace-pre-wrap">{order.notes}</p>
                </div>
            )}

            {/* Receipt Footer Message */}
            <div className="text-center pt-4 border-t border-dashed border-slate-300 text-[11px] font-semibold text-slate-600 space-y-1.5">
                <p className="font-black text-slate-900 uppercase tracking-wide">
                    ¡GRACIAS POR TU COMPRA EN CHEESEPAPAS! 🍟
                </p>
                <p className="text-xs font-bold text-slate-800">
                    Tel: +57 310 3967137
                </p>
                {note && <p className="text-slate-500 text-[10px]">{note}</p>}
                <p className="italic font-extrabold text-slate-900 text-xs pt-1 border-t border-slate-200 mt-2">
                    "Cuando pienses en papas piensa en cheesepapas"
                </p>
                <p className="text-[10px] text-slate-400">www.cheesepapas.com</p>
            </div>
        </div>
    )
}
