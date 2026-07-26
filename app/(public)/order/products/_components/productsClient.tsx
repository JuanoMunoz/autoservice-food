'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/app/_hooks/use-cart'
import Image from 'next/image'
import { formatCurrency, getCartFromStorage } from '@/utils/cartStorage'
import { ArrowLeft, ShoppingCart, Utensils, CupSoda, MapPin, Truck, RefreshCw, X, ChevronRight } from 'lucide-react'
import { LocationType } from '@/types/Order'

interface Product {
    id: string
    name: string
    description: string
    imageRoute?: string
    price: string
}

interface Drink {
    id: string
    name: string
    description: string
    imageRoute?: string
    price: string
}

interface ProductsClientProps {
    initialProducts: Product[]
    initialDrinks: Drink[]
}

export default function ProductsClient({ initialProducts, initialDrinks }: ProductsClientProps) {
    const router = useRouter()
    const { cart, isHydrated, getTotal, getItemCount, setLocation } = useCart()
    const [products] = useState<Product[]>(initialProducts)
    const [drinks] = useState<Drink[]>(initialDrinks)
    const [activeCategory, setActiveCategory] = useState<'comidas' | 'bebidas'>('comidas')
    const [showLocationModal, setShowLocationModal] = useState(false)

    useEffect(() => {
        if (!isHydrated) return

        const saved = getCartFromStorage()
        const locationToUse = cart.location || saved?.location

        if (!locationToUse) {
            router.push('/order')
        }
    }, [cart.location, isHydrated, router])

    const handleProductClick = (productId: string) => {
        router.push(`/order/product/${productId}`)
    }

    const handleDrinkClick = (drinkId: string) => {
        router.push(`/order/drink/${drinkId}`)
    }

    const handleLocationChange = (newLocation: LocationType) => {
        setLocation(newLocation)
        setShowLocationModal(false)
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans select-none">
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/order')}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-none transition-all border border-slate-200 active:scale-95 cursor-pointer touch-manipulation"
                        title="Volver"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-saira font-extrabold text-slate-900 tracking-wider flex items-center gap-2">
                            Cheese<span className="text-secondary">Papas</span>
                        </h1>
                        <p className="text-xs text-slate-500 font-semibold hidden sm:block">Autoservicio</p>
                    </div>
                </div>

                {/* Location Chip Switcher */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowLocationModal(true)}
                        className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 border border-slate-300 hover:border-secondary text-slate-900 rounded-sm transition-all active:scale-95 shadow-sm cursor-pointer touch-manipulation"
                    >
                        {cart.location === 'onSite' ? (
                            <>
                                <MapPin className="w-4 h-4 text-slate-900" />
                                <span className="text-xs sm:text-sm font-bold">En el local</span>
                            </>
                        ) : (
                            <>
                                <Truck className="w-4 h-4 text-slate-900" />
                                <span className="text-xs sm:text-sm font-bold">A domicilio</span>
                            </>
                        )}
                        <span className="bg-secondary text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-sm ml-1">
                            Cambiar
                        </span>
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Navigation */}
                <aside className="w-24 sm:w-28 md:w-36 bg-slate-50 border-r border-slate-200 flex flex-col items-center py-4 px-2 gap-3 shrink-0 shadow-sm">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Categorías</span>

                    <button
                        onClick={() => setActiveCategory('comidas')}
                        className={`w-full flex flex-col items-center justify-center p-3 sm:p-4 rounded-sm transition-all border cursor-pointer touch-manipulation ${activeCategory === 'comidas'
                            ? 'bg-secondary text-white border-secondary font-black shadow-md'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                    >
                        <div className={`p-2 rounded-sm mb-1.5 ${activeCategory === 'comidas' ? 'bg-black/10' : 'bg-slate-200/60'
                            }`}>
                            <Utensils className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-center leading-tight">Comidas</span>
                    </button>

                    <button
                        onClick={() => setActiveCategory('bebidas')}
                        className={`w-full flex flex-col items-center justify-center p-3 sm:p-4 rounded-sm transition-all border cursor-pointer touch-manipulation ${activeCategory === 'bebidas'
                            ? 'bg-secondary text-white border-secondary font-black shadow-md'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                    >
                        <div className={`p-2 rounded-sm mb-1.5 ${activeCategory === 'bebidas' ? 'bg-black/10' : 'bg-slate-200/60'
                            }`}>
                            <CupSoda className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-center leading-tight">Bebidas</span>
                    </button>
                </aside>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white pb-32">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-3">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 capitalize flex items-center gap-2">
                                {activeCategory === 'comidas' ? '¡Nuestras delicias!' : '¡Nuestras bebidas!'}
                            </h2>
                        </div>


                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {activeCategory === 'comidas' && products.length > 0 ? (
                                products.map((product) => (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => handleProductClick(product.id)}
                                        className="group cursor-pointer flex flex-col items-center text-center p-3.5 rounded-sm bg-white border border-slate-200 hover:border-secondary shadow-sm transition-all duration-200 active:scale-95 touch-manipulation w-full text-left"
                                    >
                                        <div className="relative w-full aspect-square max-w-[200px] bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 pointer-events-none rounded-sm">
                                            {product.imageRoute ? (
                                                <Image
                                                    src={product.imageRoute}
                                                    alt={product.name}
                                                    fill
                                                    unoptimized
                                                    className="object-contain p-2 relative z-10 group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="relative z-10 flex flex-col items-center justify-center text-slate-400 gap-1">
                                                    <Utensils className="w-12 h-12 stroke-1" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Name & Price */}
                                        <h3 className="font-black text-base sm:text-lg text-slate-900 line-clamp-2 leading-snug pointer-events-none">
                                            {product.name.toLocaleUpperCase()}
                                        </h3>
                                        <div className="mt-2.5 inline-block text-white bg-secondary font-black text-sm sm:text-base px-3.5 py-1 rounded-sm shadow-sm pointer-events-none">
                                            {formatCurrency(parseFloat(product.price))}
                                        </div>
                                    </button>
                                ))
                            ) : activeCategory === 'bebidas' && drinks.length > 0 ? (
                                drinks.map((drink) => (
                                    <button
                                        key={drink.id}
                                        type="button"
                                        onClick={() => handleDrinkClick(drink.id)}
                                        className="group cursor-pointer flex flex-col items-center text-center p-3.5 rounded-sm bg-white border border-slate-200 hover:border-secondary shadow-sm transition-all duration-200 active:scale-95 touch-manipulation w-full text-left"
                                    >
                                        <div className="relative w-full aspect-square max-w-[200px] bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 pointer-events-none rounded-sm">
                                            {drink.imageRoute ? (
                                                <Image
                                                    src={drink.imageRoute}
                                                    alt={drink.name}
                                                    fill
                                                    unoptimized
                                                    className="object-contain p-2 relative z-10 group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="relative z-10 flex flex-col items-center justify-center text-slate-400 gap-1">
                                                    <CupSoda className="w-12 h-12 stroke-1" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Name & Price */}
                                        <h3 className="font-black text-base sm:text-lg text-slate-900 group-hover:text-slate-950 transition-colors line-clamp-2 leading-snug pointer-events-none">
                                            {drink.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 px-1 font-medium pointer-events-none">
                                            {drink.description}
                                        </p>
                                        <div className="mt-2.5 inline-block bg-secondary text-white font-black text-sm sm:text-base px-3.5 py-1 rounded-sm shadow-sm pointer-events-none">
                                            {formatCurrency(parseFloat(drink.price))}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-16 text-slate-500 font-medium text-lg">
                                    No hay {activeCategory} disponibles en este momento.
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Bottom Floating Order Bar */}
            {getItemCount() > 0 && (
                <div className="fixed bottom-4 left-4 right-4 z-40 max-w-xl mx-auto">
                    <button
                        onClick={() => router.push('/order/checkout')}
                        className="w-full bg-secondary hover:bg-secondary-hover text-white font-black p-4 rounded-sm shadow-2xl transition-all flex items-center justify-between border-2 border-secondary cursor-pointer touch-manipulation"
                    >
                        <div className="flex items-center gap-3 pointer-events-none">
                            <div className="p-2 bg-slate-950 text-white rounded-sm shadow">
                                <ShoppingCart className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <span className="block text-xs uppercase font-extrabold tracking-wider text-slate-100">Tu Pedido</span>
                                <span className="text-sm sm:text-base font-black text-white">
                                    {getItemCount()} {getItemCount() === 1 ? 'producto' : 'productos'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pointer-events-none">
                            <span className="text-lg sm:text-xl font-black bg-slate-950 text-white px-3 py-1 rounded-sm">
                                {formatCurrency(getTotal())}
                            </span>
                            <span className="bg-white text-slate-950 px-4 py-2 rounded-sm text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1">
                                Ver Carrito <ChevronRight className="w-4 h-4" />
                            </span>
                        </div>
                    </button>
                </div>
            )}

            {/* Location Switcher Modal */}
            {showLocationModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-300 rounded-sm p-6 w-full max-w-md shadow-2xl space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5 text-secondary" /> Cambiar Ubicación
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5 font-medium">¿Cómo deseas recibir tu orden?</p>
                            </div>
                            <button
                                onClick={() => setShowLocationModal(false)}
                                className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-sm transition-colors cursor-pointer"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {/* On-Site Option */}
                            <button
                                onClick={() => handleLocationChange('onSite')}
                                className={`w-full p-4 rounded-sm border text-left transition-all flex items-center gap-4 cursor-pointer touch-manipulation ${cart.location === 'onSite'
                                    ? 'bg-amber-500/10 border-secondary text-slate-900 ring-1 ring-secondary'
                                    : 'bg-white border-slate-200 hover:border-slate-400 text-slate-800'
                                    }`}
                            >
                                <div className="p-3 bg-secondary/20 text-slate-950 rounded-sm pointer-events-none">
                                    <MapPin className="w-7 h-7" />
                                </div>
                                <div className="flex-1 pointer-events-none">
                                    <h4 className="font-extrabold text-base text-slate-900">En el local (Comer aquí)</h4>
                                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Disfruta tu comida recién hecha en nuestro restaurante</p>
                                </div>
                                {cart.location === 'onSite' && (
                                    <span className="text-xs font-black bg-secondary text-white px-2.5 py-1 rounded-sm pointer-events-none">
                                        Actual
                                    </span>
                                )}
                            </button>

                            {/* Delivery Option */}
                            <button
                                onClick={() => handleLocationChange('delivery')}
                                className={`w-full p-4 rounded-sm border text-left transition-all flex items-center gap-4 cursor-pointer touch-manipulation ${cart.location === 'delivery'
                                    ? 'bg-amber-500/10 border-secondary text-slate-900 ring-1 ring-secondary'
                                    : 'bg-white border-slate-200 hover:border-slate-400 text-slate-800'
                                    }`}
                            >
                                <div className="p-3 bg-secondary/20 text-slate-950 rounded-sm pointer-events-none">
                                    <Truck className="w-7 h-7" />
                                </div>
                                <div className="flex-1 pointer-events-none">
                                    <h4 className="font-extrabold text-base text-slate-900">A domicilio (Delivery)</h4>
                                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Enviamos tu pedido hasta la puerta de tu casa</p>
                                </div>
                                {cart.location === 'delivery' && (
                                    <span className="text-xs font-black bg-secondary text-white px-2.5 py-1 rounded-sm pointer-events-none">
                                        Actual
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="pt-2 text-center text-xs text-slate-500 font-medium border-t border-slate-200">
                            Tus items del carrito se mantendrán guardados.
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
