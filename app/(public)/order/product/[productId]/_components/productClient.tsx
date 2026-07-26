'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/app/_hooks/use-cart'
import { CartProduct, CartIngredient, CartSauce } from '@/types/Order'
import Image from 'next/image'
import { formatCurrency, getCartFromStorage } from '@/utils/cartStorage'
import { ArrowLeft, Plus, Minus, Utensils, ShoppingBag } from 'lucide-react'

interface ProductDetail {
    id: string
    name: string
    description: string
    imageRoute?: string
    price: string
    productIngredients: Array<{
        ingredient: {
            id: string
            name: string
            price: string
            isTopping: boolean
            type: string
            description: string
            imageRoute?: string
        }
    }>
}

interface ProductClientProps {
    initialProduct: ProductDetail
    initialSauces: CartSauce[]
}

export default function ProductClient({ initialProduct, initialSauces }: ProductClientProps) {
    const router = useRouter()
    const { addItem, isHydrated, cart } = useCart()

    const [product] = useState<ProductDetail>(initialProduct)
    const [availableSauces] = useState<CartSauce[]>(initialSauces)
    const [quantity, setQuantity] = useState(1)
    const [selectedIngredients, setSelectedIngredients] = useState<CartIngredient[]>([])
    const [selectedSauces, setSelectedSauces] = useState<CartSauce[]>([])

    useEffect(() => {
        if (!isHydrated) return

        const saved = getCartFromStorage()
        const locationToUse = cart.location || saved?.location

        if (!locationToUse) {
            router.push('/order')
        }
    }, [cart.location, isHydrated, router])

    const handleAddToCart = () => {
        if (!product) return

        const cartProduct: CartProduct = {
            type: 'product',
            id: product.id,
            name: product.name,
            description: product.description,
            imageRoute: product.imageRoute,
            price: parseFloat(product.price),
            quantity,
            ingredients: selectedIngredients,
            sauces: selectedSauces,
        }

        addItem(cartProduct)
        router.push('/order/products')
    }

    const handleIncreaseIngredient = (ingredient: { id: string; name: string; price: number }) => {
        setSelectedIngredients((prev) => {
            const existing = prev.find((i) => i.id === ingredient.id)
            if (existing) {
                return prev.map((i) =>
                    i.id === ingredient.id ? { ...i, quantity: i.quantity + 1 } : i
                )
            } else {
                return [...prev, { ...ingredient, quantity: 1 }]
            }
        })
    }

    const handleDecreaseIngredient = (ingredientId: string) => {
        setSelectedIngredients((prev) => {
            const existing = prev.find((i) => i.id === ingredientId)
            if (!existing) return prev
            if (existing.quantity <= 1) {
                return prev.filter((i) => i.id !== ingredientId)
            }
            return prev.map((i) =>
                i.id === ingredientId ? { ...i, quantity: i.quantity - 1 } : i
            )
        })
    }

    const handleToggleSauce = (sauce: CartSauce) => {
        setSelectedSauces((prev) => {
            const exists = prev.some((s) => s.id === sauce.id)
            if (exists) {
                return prev.filter((s) => s.id !== sauce.id)
            } else {
                return [...prev, sauce]
            }
        })
    }

    // Filter ingredients: type FOOD/comida AND isTopping === true
    const foodToppings = product.productIngredients
        ? product.productIngredients.filter(
            (pi) =>
                pi.ingredient &&
                (pi.ingredient.type?.toUpperCase() === 'FOOD' || pi.ingredient.type?.toLowerCase() === 'comida') &&
                Boolean(pi.ingredient.isTopping)
        )
        : []

    const ingredientsCost = selectedIngredients.reduce(
        (sum, ing) => sum + ing.price * ing.quantity,
        0
    )
    const totalPrice = (parseFloat(product?.price || '0') + ingredientsCost) * quantity

    return (
        <div className="min-h-screen bg-white text-slate-900 pb-36 font-sans select-none">
            {/* Kiosk Header */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
                <button
                    onClick={() => router.back()}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-sm transition-all border border-slate-200 active:scale-95 cursor-pointer touch-manipulation"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-black text-slate-900 tracking-wide text-center">
                    Personalizar Pedido
                </h1>
                <div className="w-10" />
            </header>

            <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-8">
                {/* Product Hero */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative w-full aspect-square max-w-sm flex items-center justify-center bg-slate-50 border border-slate-200 rounded-sm p-4">
                        {product.imageRoute ? (
                            <Image
                                src={product.imageRoute}
                                alt={product.name}
                                fill
                                unoptimized
                                className="object-contain p-2 relative z-10 hover:scale-105 transition-transform duration-300"
                            />
                        ) : (
                            <div className="relative z-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                                <Utensils className="w-20 h-20 stroke-1" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 max-w-lg">
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{product.name}</h2>
                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">{product.description}</p>
                        <div className="pt-2">
                            <span className="inline-block bg-secondary text-white font-black text-xl px-5 py-2 rounded-sm shadow-sm">
                                {formatCurrency(totalPrice)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quantity Control */}
                <div className="py-4 border-y border-slate-200 flex items-center justify-between">
                    <span className="text-base font-black text-slate-900">Cantidad de Producto</span>
                    <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-sm border border-slate-200">
                        <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-10 bg-white hover:bg-slate-200 text-slate-900 font-black rounded-sm flex items-center justify-center transition-all border border-slate-200 active:scale-95 cursor-pointer touch-manipulation"
                        >
                            <Minus className="w-5 h-5" />
                        </button>
                        <span className="text-xl font-black text-slate-900 w-8 text-center">{quantity}</span>
                        <button
                            type="button"
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-10 h-10 bg-secondary hover:bg-secondary-hover text-white font-black rounded-sm flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer touch-manipulation"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Toppings (FOOD type with isTopping === true) with Quantity Counters */}
                {foodToppings.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900">
                                Adicionales / Toppings (Comida)
                            </h3>
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                                Opcional
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {foodToppings.map((pi) => {
                                const ingPrice = parseFloat(pi.ingredient.price)
                                const selectedIng = selectedIngredients.find((i) => i.id === pi.ingredient.id)
                                const currentQty = selectedIng ? selectedIng.quantity : 0

                                return (
                                    <div
                                        key={pi.ingredient.id}
                                        className={`w-full p-3.5 rounded-sm transition-all border flex items-center justify-between gap-3 ${
                                            currentQty > 0
                                                ? 'bg-amber-500/10 border-secondary shadow-sm'
                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="relative w-14 h-14 bg-slate-50 border border-slate-200 rounded-sm overflow-hidden shrink-0 flex items-center justify-center p-1">
                                                {pi.ingredient.imageRoute ? (
                                                    <Image
                                                        src={pi.ingredient.imageRoute}
                                                        alt={pi.ingredient.name}
                                                        fill
                                                        unoptimized
                                                        className="object-contain"
                                                    />
                                                ) : (
                                                    <Utensils className="w-6 h-6 text-slate-300 stroke-1" />
                                                )}
                                            </div>

                                            <div className="space-y-0.5 flex-1 min-w-0">
                                                <p className="font-extrabold text-sm text-slate-900 truncate">{pi.ingredient.name}</p>
                                                <p className="text-xs text-amber-700 font-extrabold">
                                                    +{formatCurrency(ingPrice)} c/u
                                                </p>
                                                {pi.ingredient.description && (
                                                    <p className="text-xs text-slate-500 line-clamp-1">{pi.ingredient.description}</p>
                                                )}
                                            </div>
                                        </div>

                                        {currentQty === 0 ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleIncreaseIngredient({
                                                        id: pi.ingredient.id,
                                                        name: pi.ingredient.name,
                                                        price: ingPrice,
                                                    })
                                                }
                                                className="bg-secondary hover:bg-secondary-hover text-white px-3 py-2 rounded-sm font-black text-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all shadow-sm shrink-0 touch-manipulation"
                                            >
                                                <Plus className="w-4 h-4" /> Agregar
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2 bg-white p-1 rounded-sm border border-slate-300 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDecreaseIngredient(pi.ingredient.id)}
                                                    className="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black rounded-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 touch-manipulation"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="text-sm font-black text-slate-900 w-6 text-center">{currentQty}</span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleIncreaseIngredient({
                                                            id: pi.ingredient.id,
                                                            name: pi.ingredient.name,
                                                            price: ingPrice,
                                                        })
                                                    }
                                                    className="w-8 h-8 bg-secondary hover:bg-secondary-hover text-white font-black rounded-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 touch-manipulation"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Sauces Selection Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                        <h3 className="text-lg font-black text-slate-900">
                            Salsas Especiales
                        </h3>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                            {selectedSauces.length > 0 ? `${selectedSauces.length} seleccionada(s)` : 'Opcional'}
                        </span>
                    </div>

                    {availableSauces.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {availableSauces.map((sauce) => {
                                const isSelected = selectedSauces.some((s) => s.id === sauce.id)
                                return (
                                    <button
                                        key={sauce.id}
                                        type="button"
                                        onClick={() => handleToggleSauce(sauce)}
                                        className={`w-full text-left py-2.5 px-3.5 rounded-sm cursor-pointer transition-all border flex items-center justify-between gap-3 active:scale-95 touch-manipulation ${
                                            isSelected
                                                ? 'bg-amber-500/10 border-secondary text-slate-900 font-bold'
                                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 pointer-events-none">
                                            <div
                                                className="w-6 h-6 rounded-sm border border-slate-300 shadow-sm shrink-0"
                                                style={{ backgroundColor: sauce.hex || '#ffffff' }}
                                            />
                                            <span className="text-sm font-extrabold text-slate-900">{sauce.name}</span>
                                        </div>

                                        <div className={`w-5 h-5 rounded-sm flex items-center justify-center border transition-colors pointer-events-none ${
                                            isSelected ? 'bg-secondary border-secondary text-white' : 'border-slate-300 bg-slate-50'
                                        }`}>
                                            {isSelected && <span className="text-xs font-bold">✓</span>}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 italic">No hay salsas disponibles en este momento.</p>
                    )}
                </div>
            </main>

            {/* Bottom Add to Cart Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-xl">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <button
                        onClick={handleAddToCart}
                        className="w-full bg-secondary hover:bg-secondary-hover text-white font-black py-4 px-6 rounded-sm shadow-md transition-all flex items-center justify-between text-base sm:text-lg border-2 border-secondary cursor-pointer touch-manipulation active:scale-[0.99]"
                    >
                        <span className="flex items-center gap-2 pointer-events-none">
                            <ShoppingBag className="w-6 h-6" /> Agregar a mi Pedido
                        </span>
                        <span className="bg-slate-950 text-white px-3.5 py-1.5 rounded-sm font-black text-sm sm:text-base pointer-events-none">
                            {formatCurrency(totalPrice)}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    )
}
