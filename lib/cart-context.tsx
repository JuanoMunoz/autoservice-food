'use client'

import React, { createContext, useCallback, useEffect, useState } from 'react'
import {
    Cart,
    CartItem,
    CartProduct,
    CartDrink,
    DeliveryAddress,
    LocationType,
    PaymentType,
} from '@/types/Order'
import { getCartFromStorage, saveCartToStorage } from '@/utils/cartStorage'

export interface CartContextType {
    cart: Cart
    isHydrated: boolean
    setLocation: (location: LocationType) => void
    addItem: (item: CartItem) => void
    removeItem: (itemId: string, itemType: 'product' | 'drink') => void
    updateItemQuantity: (itemId: string, quantity: number, itemType: 'product' | 'drink') => void
    updateItemIngredients: (itemId: string, ingredients: any[], itemType: 'product' | 'drink') => void
    updateItemSauces: (itemId: string, sauces: any[], itemType: 'product' | 'drink') => void
    setBuyerName: (name: string) => void
    setDeliveryAddress: (address: DeliveryAddress) => void
    setPaymentType: (type: PaymentType) => void
    getTotal: () => number
    clearCart: () => void
    getItemCount: () => number
}

export const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<Cart>({ items: [] })
    const [isHydrated, setIsHydrated] = useState(false)

    // Cargar carrito del localStorage al montar
    useEffect(() => {
        const savedCart = getCartFromStorage()
        if (savedCart) {
            setCart(savedCart)
        }
        setIsHydrated(true)
    }, [])

    // Guardar carrito en localStorage cada vez que cambie
    useEffect(() => {
        if (isHydrated) {
            saveCartToStorage(cart)
        }
    }, [cart, isHydrated])

    const setLocation = useCallback((location: LocationType) => {
        setCart((prev) => {
            const updated = {
                ...prev,
                location,
            }
            saveCartToStorage(updated)
            return updated
        })
    }, [])


    const addItem = useCallback((item: CartItem) => {
        setCart((prev) => {
            const existingItem = prev.items.find(
                (i) => i.id === item.id && i.id === (item as any).id
            )

            if (existingItem && existingItem.quantity !== undefined) {
                return {
                    ...prev,
                    items: prev.items.map((i) =>
                        i.id === item.id
                            ? { ...i, quantity: (i.quantity || 0) + (item.quantity || 1) }
                            : i
                    ),
                }
            }

            return {
                ...prev,
                items: [...prev.items, { ...item, quantity: item.quantity || 1 }],
            }
        })
    }, [])

    const removeItem = useCallback((itemId: string, itemType: 'product' | 'drink') => {
        setCart((prev) => ({
            ...prev,
            items: prev.items.filter((item) => item.id !== itemId),
        }))
    }, [])

    const updateItemQuantity = useCallback(
        (itemId: string, quantity: number, itemType: 'product' | 'drink') => {
            if (quantity <= 0) {
                removeItem(itemId, itemType)
                return
            }

            setCart((prev) => ({
                ...prev,
                items: prev.items.map((item) =>
                    item.id === itemId ? { ...item, quantity } : item
                ),
            }))
        },
        [removeItem]
    )

    const updateItemIngredients = useCallback(
        (itemId: string, ingredients: any[], itemType: 'product' | 'drink') => {
            setCart((prev) => ({
                ...prev,
                items: prev.items.map((item) =>
                    item.id === itemId && 'ingredients' in item
                        ? { ...item, ingredients }
                        : item
                ),
            }))
        },
        []
    )

    const updateItemSauces = useCallback(
        (itemId: string, sauces: any[], itemType: 'product' | 'drink') => {
            setCart((prev) => ({
                ...prev,
                items: prev.items.map((item) =>
                    item.id === itemId && 'sauces' in item ? { ...item, sauces } : item
                ),
            }))
        },
        []
    )

    const setBuyerName = useCallback((name: string) => {
        setCart((prev) => ({
            ...prev,
            buyerName: name,
        }))
    }, [])

    const setDeliveryAddress = useCallback((address: DeliveryAddress) => {
        setCart((prev) => ({
            ...prev,
            deliveryAddress: address,
        }))
    }, [])

    const setPaymentType = useCallback((type: PaymentType) => {
        setCart((prev) => ({
            ...prev,
            paymentType: type,
        }))
    }, [])

    const getTotal = useCallback(() => {
        return cart.items.reduce((total, item) => {
            let itemTotal = (item.price || 0) * (item.quantity || 1)
            if ('ingredients' in item && item.ingredients) {
                itemTotal += item.ingredients.reduce(
                    (sum, ing) => sum + ing.price * ing.quantity,
                    0
                )
            }
            return total + itemTotal
        }, 0)
    }, [cart.items])

    const getItemCount = useCallback(() => {
        return cart.items.reduce((count, item) => count + (item.quantity || 1), 0)
    }, [cart.items])

    const clearCart = useCallback(() => {
        setCart({ items: [] })
    }, [])

    const value: CartContextType = {
        cart,
        isHydrated,
        setLocation,
        addItem,
        removeItem,
        updateItemQuantity,
        updateItemIngredients,
        updateItemSauces,
        setBuyerName,
        setDeliveryAddress,
        setPaymentType,
        getTotal,
        clearCart,
        getItemCount,
    }

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
