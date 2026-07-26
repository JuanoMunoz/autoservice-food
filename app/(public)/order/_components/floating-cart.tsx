'use client'

import { useRouter } from 'next/navigation'
import { useCart } from '@/app/_hooks/use-cart'
import { formatCurrency } from '@/utils/cartStorage'
import { useEffect, useState } from 'react'

export function FloatingCart() {
    const router = useRouter()
    const { getItemCount, getTotal } = useCart()
    const [isVisible, setIsVisible] = useState(false)

    const itemCount = getItemCount()
    const total = getTotal()

    useEffect(() => {
        setIsVisible(itemCount > 0)
    }, [itemCount])

    if (!isVisible) return null

    return (
        <button
            onClick={() => router.push('/order/checkout')}
            className="fixed bottom-6 left-4 right-4 bg-secondary hover:bg-secondary-hover text-white font-black py-4 rounded-sm shadow-xl transition-all max-w-sm mx-auto md:max-w-md flex items-center justify-between px-6 z-30 cursor-pointer border-2 border-secondary"
        >
            <span className="flex items-center gap-2">
                <span className="text-xl">🛒</span>
                <span>Ver Carrito ({itemCount})</span>
            </span>
            <span className="text-lg bg-slate-950 text-white px-3 py-1 font-black rounded-sm">{formatCurrency(total)}</span>
        </button>
    )
}
