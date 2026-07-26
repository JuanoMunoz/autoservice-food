'use client'

import Image from 'next/image'
import { CartItem } from '@/types/Order'
import { formatCurrency } from '@/utils/cartStorage'
import { calculateItemTotalPrice, calculateIngredientsTotal } from '@/utils/orderCalculations'

interface CartItemCardProps {
    item: CartItem
    onRemove?: (itemId: string) => void
    onQuantityChange?: (itemId: string, quantity: number) => void
    displayMode?: 'compact' | 'detailed'
}

export function CartItemCard({
    item,
    onRemove,
    onQuantityChange,
    displayMode = 'compact',
}: CartItemCardProps) {
    const ingredientsCost = 'ingredients' in item ? calculateIngredientsTotal(item as any) : 0
    const itemTotal = calculateItemTotalPrice(item)

    if (displayMode === 'compact') {
        return (
            <div className="flex gap-3 p-3 bg-slate-50 border border-slate-200 rounded-none">
                <div className="flex-1">
                    <h3 className="font-bold text-sm text-slate-900">{item.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">Cantidad: {item.quantity}</p>
                    {item && 'ingredients' in item && item.ingredients && item.ingredients.length > 0 && (
                        <p className="text-xs text-amber-600 font-semibold">
                            + {item.ingredients.length} ingredientes
                        </p>
                    )}
                </div>
                <p className="font-black text-secondary">{formatCurrency(itemTotal)}</p>
            </div>
        )
    }

    return (
        <div className="bg-white border border-slate-200 rounded-none overflow-hidden shadow-sm">
            {/* Image */}
            {item.imageRoute && (
                <div className="relative w-full aspect-video bg-slate-100">
                    <Image
                        src={item.imageRoute}
                        alt={item.name}
                        fill
                        className="object-cover"
                    />
                </div>
            )}

            {/* Content */}
            <div className="p-4">
                <h3 className="font-bold text-lg text-slate-900">{item.name}</h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">{item.description}</p>

                {/* Ingredients */}
                {item && 'ingredients' in item && item.ingredients && item.ingredients.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs font-semibold text-slate-900 mb-2">Ingredientes adicionales:</p>
                        <div className="space-y-1">
                            {item.ingredients.map((ing) => (
                                <div key={ing.id} className="text-xs text-slate-600 flex justify-between">
                                    <span>{ing.name}</span>
                                    <span className="text-amber-600 font-semibold">
                                        +{formatCurrency(ing.price)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sauces */}
                {item && 'sauces' in item && item.sauces && item.sauces.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs font-semibold text-slate-900 mb-2">Salsas:</p>
                        <div className="flex gap-2 flex-wrap">
                            {item.sauces.map((sauce) => (
                                <span
                                    key={sauce.id}
                                    className="inline-block px-2 py-1 text-xs rounded-none"
                                    style={{
                                        backgroundColor: sauce.hex + '30',
                                        borderLeft: `3px solid ${sauce.hex}`,
                                        color: '#0f172a',
                                    }}
                                >
                                    {sauce.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {onQuantityChange && (
                            <div className="flex items-center gap-2 bg-slate-100 rounded-none p-1 border border-slate-200">
                                <button
                                    onClick={() => onQuantityChange(item.id, Math.max(1, item.quantity - 1))}
                                    className="w-6 h-6 flex items-center justify-center hover:bg-slate-200 rounded-none text-slate-800 font-bold"
                                >
                                    −
                                </button>
                                <span className="w-8 text-center text-sm font-black text-slate-900">{item.quantity}</span>
                                <button
                                    onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                                    className="w-6 h-6 flex items-center justify-center hover:bg-slate-200 rounded-none text-slate-800 font-bold"
                                >
                                    +
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-500 font-medium">
                            {formatCurrency(item.price)} × {item.quantity}
                        </p>
                        <p className="font-black text-lg text-secondary">{formatCurrency(itemTotal)}</p>
                    </div>
                </div>

                {onRemove && (
                    <button
                        onClick={() => onRemove(item.id)}
                        className="w-full mt-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-none transition-colors border border-red-200"
                    >
                        Eliminar
                    </button>
                )}
            </div>
        </div>
    )
}
