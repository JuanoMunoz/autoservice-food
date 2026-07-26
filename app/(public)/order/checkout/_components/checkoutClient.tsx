'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/app/_hooks/use-cart'
import { formatCurrency, getCartFromStorage } from '@/utils/cartStorage'
import { PaymentType } from '@/types/Order'
import { createOrder, getDeliveryFee } from '@/app/(public)/order/actions'
import { ArrowLeft, DollarSign, CreditCard, Send, MapPin, ShoppingBag, Check, Truck, X, Plus, Minus, Trash2 } from 'lucide-react'

interface CheckoutClientProps {
    initialDeliveryFee?: number
}

export default function CheckoutClient({ initialDeliveryFee = 0 }: CheckoutClientProps) {
    const router = useRouter()
    const {
        cart,
        isHydrated,
        getTotal,
        setBuyerName,
        setDeliveryAddress,
        setPaymentType,
        clearCart,
        updateItemQuantity,
        removeItem,
    } = useCart()

    const [isLoading, setIsLoading] = useState(false)
    const [deliveryFee, setDeliveryFee] = useState<number>(initialDeliveryFee)
    const [streetInput, setStreetInput] = useState(cart.deliveryAddress?.street || '')
    const [referenceInput, setReferenceInput] = useState(cart.deliveryAddress?.reference || '')
    const [selectedPayment, setSelectedPayment] = useState<PaymentType | null>(cart.paymentType || 'cash')
    const [errorModal, setErrorModal] = useState<string | null>(null)
    const isNavigatingToConfirmation = useRef(false)

    useEffect(() => {
        if (!isHydrated || isNavigatingToConfirmation.current) return

        const saved = getCartFromStorage()
        const locationToUse = cart.location || saved?.location

        if (!locationToUse || cart.items.length === 0) {
            router.push('/order/products')
        }
    }, [cart.location, cart.items.length, isHydrated, router])

    useEffect(() => {
        async function loadFee() {
            try {
                const fee = await getDeliveryFee()
                setDeliveryFee(fee)
            } catch (err) {
                console.error('Error loading delivery fee:', err)
            }
        }
        loadFee()
    }, [])

    const subtotal = getTotal()
    const activeDeliveryFee = cart.location === 'delivery' ? deliveryFee : 0
    const finalTotal = subtotal + activeDeliveryFee

    const handleStreetChange = (val: string) => {
        setStreetInput(val)
        setDeliveryAddress({
            street: val,
            reference: referenceInput,
        })
    }

    const handleReferenceChange = (val: string) => {
        setReferenceInput(val)
        setDeliveryAddress({
            street: streetInput,
            reference: val,
        })
    }

    const handleCreateOrder = async () => {
        if (!selectedPayment) {
            setErrorModal('Por favor selecciona un método de pago')
            return
        }

        setIsLoading(true)
        try {
            if (!cart.location) {
                setErrorModal('Debes seleccionar una ubicación')
                setIsLoading(false)
                return
            }

            const deliveryAddressToUse = cart.location === 'delivery' ? {
                street: streetInput.trim() || 'Dirección Principal de Entrega',
                reference: referenceInput.trim(),
            } : undefined

            if (deliveryAddressToUse) {
                setDeliveryAddress(deliveryAddressToUse)
            }

            setPaymentType(selectedPayment)

            const orderDetails = {
                location: cart.location,
                items: cart.items,
                buyerName: cart.buyerName || 'Cliente',
                deliveryAddress: deliveryAddressToUse,
                paymentType: selectedPayment,
                total: finalTotal,
            }

            const response = await createOrder(orderDetails)
            isNavigatingToConfirmation.current = true
            clearCart()
            router.push(`/order/confirmation/${response.id}`)
        } catch (error) {
            console.error('Error creating order:', error)
            setErrorModal('Ocurrió un error al procesar tu orden. Por favor intenta nuevamente.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 pb-36 font-sans select-none">
            {/* Kiosk Header */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-sm transition-all border border-slate-200 cursor-pointer active:scale-95 touch-manipulation"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-black text-slate-900 tracking-wide text-center">
                    Resumen de tu Pedido
                </h1>
                <div className="w-10" />
            </header>

            <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
                {/* Location Banner */}
                <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        {cart.location === 'onSite' ? (
                            <div className="p-2.5 bg-secondary text-white rounded-sm font-black">
                                <MapPin className="w-5 h-5" />
                            </div>
                        ) : (
                            <div className="p-2.5 bg-secondary text-white rounded-sm font-black">
                                <Truck className="w-5 h-5" />
                            </div>
                        )}
                        <div>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Tipo de Pedido</span>
                            <p className="text-sm font-black text-slate-900">
                                {cart.location === 'onSite' ? 'En el local (Comer aquí)' : 'A domicilio (Delivery)'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push('/order/products')}
                        className="text-xs font-bold text-secondary hover:underline cursor-pointer touch-manipulation"
                    >
                        Modificar
                    </button>
                </div>

                {/* Items List */}
                <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm space-y-4">
                    <h2 className="text-lg font-black text-slate-900 border-b border-slate-200 pb-3 flex items-center justify-between">
                        <span>Productos en tu Carrito</span>
                        <span className="bg-amber-500/10 border border-secondary text-secondary text-xs px-2.5 py-1 rounded-sm font-extrabold">
                            {cart.items.length} {cart.items.length === 1 ? 'producto' : 'productos'}
                        </span>
                    </h2>

                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {cart.items.map((item, idx) => {
                            const itemTotalPrice = (item.price * (item.quantity || 1)) +
                                ('ingredients' in item && item.ingredients
                                    ? item.ingredients.reduce(
                                        (sum, ing) => sum + ing.price * ing.quantity,
                                        0
                                    )
                                    : 0)

                            return (
                                <div
                                    key={`${item.id}-${idx}`}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-sm border border-slate-200 gap-3"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-extrabold text-sm text-slate-900">{item.name}</h3>
                                            <p className="font-black text-secondary text-base sm:hidden">
                                                {formatCurrency(itemTotalPrice)}
                                            </p>
                                        </div>
                                        {item && 'ingredients' in item && item.ingredients && item.ingredients.length > 0 && (
                                            <p className="text-xs text-amber-600 font-semibold mt-0.5">
                                                + {item.ingredients.length} topping(s) adicional(es)
                                            </p>
                                        )}
                                        {item && 'sauces' in item && item.sauces && item.sauces.length > 0 && (
                                            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                                                {item.sauces.map((sauce) => (
                                                    <span key={sauce.id} className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-sm text-[11px] font-bold text-slate-800 border border-slate-200">
                                                        <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0 border border-slate-300" style={{ backgroundColor: sauce.hex }} />
                                                        {sauce.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Controls & Price */}
                                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                                        {/* Quantity buttons */}
                                        <div className="flex items-center gap-2 bg-white p-1 rounded-sm border border-slate-200 shadow-sm">
                                            <button
                                                type="button"
                                                onClick={() => updateItemQuantity(item.id, (item.quantity || 1) - 1, item.type)}
                                                className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 touch-manipulation"
                                                title="Disminuir cantidad"
                                            >
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="text-sm font-black text-slate-900 w-6 text-center">{item.quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => updateItemQuantity(item.id, (item.quantity || 1) + 1, item.type)}
                                                className="w-7 h-7 bg-secondary hover:bg-secondary-hover text-white font-black rounded-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm touch-manipulation"
                                                title="Aumentar cantidad"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id, item.type)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-colors cursor-pointer touch-manipulation"
                                            title="Eliminar del carrito"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        {/* Item Total Price (Desktop) */}
                                        <p className="font-black text-secondary text-base hidden sm:block min-w-[70px] text-right">
                                            {formatCurrency(itemTotalPrice)}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Buyer Name */}
                <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm space-y-3">
                    <h3 className="text-base font-black text-slate-900">Nombre del Cliente (Opcional)</h3>
                    <input
                        type="text"
                        placeholder="Ej: Juan Pérez"
                        defaultValue={cart.buyerName || ''}
                        onChange={(e) => setBuyerName(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-none text-slate-900 placeholder-slate-400 focus:outline-none focus:border-secondary transition-colors font-medium"
                    />
                </div>

                {/* Delivery Address direct inputs if delivery mode */}
                {cart.location === 'delivery' && (
                    <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Truck className="w-5 h-5 text-slate-800" />
                                <h3 className="text-base font-black text-slate-900">Dirección de Entrega a Domicilio</h3>
                            </div>
                            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-secondary text-slate-900 font-extrabold text-xs px-2.5 py-1 rounded-sm">
                                <span>Costo Domicilio:</span>
                                <span className="text-amber-700 font-black">{formatCurrency(deliveryFee)}</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                                    Dirección Completa
                                </label>
                                <input
                                    type="text"
                                    value={streetInput}
                                    onChange={(e) => handleStreetChange(e.target.value)}
                                    placeholder="Ej: Calle 45 #23-12, Apto 301"
                                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-secondary font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                                    Referencia (Opcional)
                                </label>
                                <input
                                    type="text"
                                    value={referenceInput}
                                    onChange={(e) => handleReferenceChange(e.target.value)}
                                    placeholder="Ej: Casa esquinera portón blanco"
                                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-secondary font-medium"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Method */}
                <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm space-y-3">
                    <h3 className="text-base font-black text-slate-900">Método de Pago</h3>
                    <div className="space-y-2">
                        {['cash', 'card', 'transfer'].map((method) => {
                            const isSelected = selectedPayment === method
                            const getPaymentLabel = (m: string) => {
                                switch (m) {
                                    case 'cash':
                                        return { label: 'Efectivo en Caja', icon: <DollarSign className="w-5 h-5 text-slate-800" /> }
                                    case 'card':
                                        return { label: 'Tarjeta de Débito/Crédito', icon: <CreditCard className="w-5 h-5 text-slate-800" /> }
                                    case 'transfer':
                                        return { label: 'Transferencia Bancaria (Nequi/Bancolombia)', icon: <Send className="w-5 h-5 text-slate-800" /> }
                                    default:
                                        return { label: m, icon: null }
                                }
                            }
                            const { label, icon } = getPaymentLabel(method)

                            return (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() => setSelectedPayment(method as PaymentType)}
                                    className={`w-full p-4 rounded-sm border cursor-pointer transition-all flex items-center justify-between touch-manipulation ${
                                        isSelected
                                            ? 'bg-amber-500/10 border-secondary text-slate-900 font-bold ring-1 ring-secondary'
                                            : 'bg-white border-slate-200 hover:border-slate-400 text-slate-800'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 pointer-events-none">
                                        <div className="p-2 bg-slate-100 rounded-sm">
                                            {icon}
                                        </div>
                                        <span className="font-extrabold text-sm text-slate-900">{label}</span>
                                    </div>
                                    <div className={`w-6 h-6 rounded-sm border flex items-center justify-center transition-colors pointer-events-none ${
                                        isSelected ? 'bg-secondary border-secondary text-white' : 'border-slate-300 bg-slate-50'
                                    }`}>
                                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Total Summary */}
                <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-sm text-slate-500 font-medium">
                        <span>Subtotal de Productos</span>
                        <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
                    </div>
                    {cart.location === 'delivery' && (
                        <div className="flex justify-between items-center text-sm text-slate-500 font-medium pt-1 border-t border-dashed border-slate-200">
                            <span className="flex items-center gap-1.5 font-bold text-slate-800">
                                <Truck className="w-4 h-4 text-secondary" /> Servicio de Domicilio
                            </span>
                            <span className="font-bold text-amber-700">+{formatCurrency(deliveryFee)}</span>
                        </div>
                    )}
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-lg font-black text-slate-900">Total a Pagar</span>
                        <span className="text-3xl font-black text-secondary">{formatCurrency(finalTotal)}</span>
                    </div>
                </div>
            </main>

            {/* Place Order Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-xl">
                <div className="max-w-2xl mx-auto">
                    <button
                        type="button"
                        onClick={handleCreateOrder}
                        disabled={isLoading}
                        className="w-full bg-secondary hover:bg-secondary-hover text-white font-black py-4 px-6 rounded-sm shadow-md transition-all flex items-center justify-center gap-2 text-lg border-2 border-secondary cursor-pointer active:scale-[0.99] disabled:opacity-50 touch-manipulation"
                    >
                        <ShoppingBag className="w-6 h-6 pointer-events-none" />
                        <span className="pointer-events-none">
                            {isLoading ? 'Confirmando Pedido...' : `Confirmar Orden — ${formatCurrency(finalTotal)}`}
                        </span>
                    </button>
                </div>
            </div>

            {/* Custom Error Modal */}
            {errorModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-300 rounded-sm p-6 w-full max-w-md shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <h3 className="text-lg font-black text-slate-900">Atención</h3>
                            <button
                                type="button"
                                onClick={() => setErrorModal(null)}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-sm transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm font-semibold text-slate-800">{errorModal}</p>
                        <button
                            type="button"
                            onClick={() => setErrorModal(null)}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-sm transition-all cursor-pointer touch-manipulation"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
