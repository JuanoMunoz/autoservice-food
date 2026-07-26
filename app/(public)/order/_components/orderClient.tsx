'use client'

import { useRouter } from 'next/navigation'
import { useCart } from '@/app/_hooks/use-cart'
import { LocationType } from '@/types/Order'
import { useState } from 'react'
import { Truck, MapPin, Sparkles, ChevronRight } from 'lucide-react'

export default function OrderClient() {
    const router = useRouter()
    const { setLocation } = useCart()
    const [isLoading, setIsLoading] = useState(false)

    const handleLocationSelect = (location: LocationType) => {
        setIsLoading(true)
        setLocation(location)
        window.location.href = '/order/products'
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center px-4 py-8 font-sans select-none">
            <div className="w-full max-w-lg space-y-8">

                <div className="text-center space-y-3">
                    <h1 className="text-4xl sm:text-5xl font-saira font-extrabold text-slate-900 tracking-wider">
                        Cheese<span className="text-secondary">Papas</span>
                    </h1>
                    <p className="text-base sm:text-lg text-slate-600 font-semibold">
                        ¿Cómo quieres disfrutar tu pedido hoy?
                    </p>
                </div>

                {/* Location Options */}
                <div className="space-y-4">
                    {/* On-site Option */}
                    <button
                        type="button"
                        onClick={() => handleLocationSelect('onSite')}
                        disabled={isLoading}
                        className="group w-full bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-secondary p-6 sm:p-8 shadow-sm transition-all duration-200 cursor-pointer text-left flex items-center gap-5 touch-manipulation rounded-sm"
                    >
                        <div className="p-4 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-sm group-hover:bg-secondary group-hover:text-white transition-colors pointer-events-none">
                            <MapPin className="w-10 h-10 sm:w-12 sm:h-12" />
                        </div>
                        <div className="flex-1 pointer-events-none">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-slate-950 transition-colors">
                                En el local (Comer aquí)
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed font-medium">
                                Para disfrutar recién hecho en nuestro establecimiento
                            </p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-slate-800 transition-colors pointer-events-none" />
                    </button>

                    {/* Delivery Option */}
                    <button
                        type="button"
                        onClick={() => handleLocationSelect('delivery')}
                        disabled={isLoading}
                        className="group w-full bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-secondary p-6 sm:p-8 shadow-sm transition-all duration-200 cursor-pointer text-left flex items-center gap-5 touch-manipulation rounded-sm"
                    >
                        <div className="p-4 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-sm group-hover:bg-secondary group-hover:text-white transition-colors pointer-events-none">
                            <Truck className="w-10 h-10 sm:w-12 sm:h-12" />
                        </div>
                        <div className="flex-1 pointer-events-none">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-slate-950 transition-colors">
                                A domicilio (Delivery)
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed font-medium">
                                Lo entregamos caliente directamente en tu dirección
                            </p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-slate-800 transition-colors pointer-events-none" />
                    </button>
                </div>

            </div>
        </div>
    )
}
