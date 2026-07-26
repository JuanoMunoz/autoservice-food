'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/app/_hooks/use-cart'
import { CartDrink } from '@/types/Order'
import Image from 'next/image'
import { formatCurrency, getCartFromStorage } from '@/utils/cartStorage'
import { ArrowLeft, Plus, Minus, CupSoda, ShoppingBag } from 'lucide-react'

interface DrinkDetail {
    id: string
    name: string
    description: string
    imageRoute?: string
    price: string
}

interface DrinkClientProps {
    initialDrink: DrinkDetail
}

export default function DrinkClient({ initialDrink }: DrinkClientProps) {
    const router = useRouter()
    const { addItem, isHydrated, cart } = useCart()

    const [drink] = useState<DrinkDetail>(initialDrink)
    const [quantity, setQuantity] = useState(1)

    useEffect(() => {
        if (!isHydrated) return

        const saved = getCartFromStorage()
        const locationToUse = cart.location || saved?.location

        if (!locationToUse) {
            router.push('/order')
        }
    }, [cart.location, isHydrated, router])

    const handleAddToCart = () => {
        if (!drink) return

        const cartDrink: CartDrink = {
            type: 'drink',
            id: drink.id,
            name: drink.name,
            description: drink.description,
            imageRoute: drink.imageRoute,
            price: parseFloat(drink.price),
            quantity,
        }

        addItem(cartDrink)
        router.push('/order/products')
    }

    const totalPrice = parseFloat(drink?.price || '0') * quantity

    return (
        <div className="min-h-screen bg-white text-slate-900 pb-36 font-sans select-none">
            {/* Kiosk Header */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-none transition-all border border-slate-200 cursor-pointer active:scale-95 touch-manipulation"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-black text-slate-900 tracking-wide text-center">
                    Seleccionar Bebida
                </h1>
                <div className="w-10" />
            </header>

            <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-8">
                {/* Drink Hero */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative w-full aspect-square max-w-sm flex items-center justify-center bg-slate-50 border border-slate-200 rounded-none p-4">
                        {drink.imageRoute ? (
                            <Image
                                src={drink.imageRoute}
                                alt={drink.name}
                                fill
                                unoptimized
                                className="object-contain p-2 relative z-10 hover:scale-105 transition-transform duration-300"
                            />
                        ) : (
                            <div className="relative z-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                                <CupSoda className="w-20 h-20 stroke-1" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 max-w-lg">
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{drink.name}</h2>
                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">{drink.description}</p>
                        <div className="pt-2">
                            <span className="inline-block bg-secondary text-white font-black text-xl px-5 py-2 rounded-sm shadow-sm">
                                {formatCurrency(totalPrice)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quantity Control */}
                <div className="py-4 border-y border-slate-200 flex items-center justify-between">
                    <span className="text-base font-black text-slate-900">Cantidad</span>
                    <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-sm border border-slate-200">
                        <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-10 bg-white hover:bg-slate-200 text-slate-900 font-black rounded-sm flex items-center justify-center transition-all cursor-pointer border border-slate-200 active:scale-95 touch-manipulation"
                        >
                            <Minus className="w-5 h-5" />
                        </button>
                        <span className="text-xl font-black text-slate-900 w-8 text-center">{quantity}</span>
                        <button
                            type="button"
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-10 h-10 bg-secondary hover:bg-secondary-hover text-white font-black rounded-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm touch-manipulation"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </main>

            {/* Bottom Add Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-xl">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <button
                        type="button"
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
