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
    setBuyerPhone: (phone: string) => void
    setBuyerEmail: (email: string) => void
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


function areCartItemsEqual(a: CartItem, b: CartItem): boolean {
    const aBaseId = (a as any).productId || (a as any).drinkId || a.id
    const bBaseId = (b as any).productId || (b as any).drinkId || b.id

    if (a.type !== b.type || aBaseId !== bBaseId) {
        return false
    }

    if (a.type === 'product' && b.type === 'product') {
        const aIngs = a.ingredients || []
        const bIngs = b.ingredients || []

        if (aIngs.length !== bIngs.length) return false

        const sortedA = [...aIngs].sort((x, y) => x.id.localeCompare(y.id))
        const sortedB = [...bIngs].sort((x, y) => x.id.localeCompare(y.id))

        for (let i = 0; i < sortedA.length; i++) {
            if (sortedA[i].id !== sortedB[i].id || sortedA[i].quantity !== sortedB[i].quantity) {
                return false
            }
        }

        const aSauces = a.sauces || []
        const bSauces = b.sauces || []

        if (aSauces.length !== bSauces.length) return false

        const sortedASauces = [...aSauces].sort((x, y) => x.id.localeCompare(y.id))
        const sortedBSauces = [...bSauces].sort((x, y) => x.id.localeCompare(y.id))

        for (let i = 0; i < sortedASauces.length; i++) {
            if (sortedASauces[i].id !== sortedBSauces[i].id) {
                return false
            }
        }
    }

    return true
}

    const addItem = useCallback((item: CartItem) => {
        setCart((prev) => {
            const existingIndex = prev.items.findIndex((existing) => areCartItemsEqual(existing, item))

            if (existingIndex !== -1) {
                const updatedItems = [...prev.items]
                const existingItem = updatedItems[existingIndex]
                updatedItems[existingIndex] = {
                    ...existingItem,
                    quantity: (existingItem.quantity || 0) + (item.quantity || 1),
                }
                return {
                    ...prev,
                    items: updatedItems,
                }
            }

            const baseId = item.id
            const uniqueId = `${baseId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
            const newItem: CartItem = {
                ...item,
                id: uniqueId,
                quantity: item.quantity || 1,
                ...(item.type === 'product'
                    ? { productId: (item as any).productId || baseId }
                    : { drinkId: (item as any).drinkId || baseId }),
            } as CartItem

            return {
                ...prev,
                items: [...prev.items, newItem],
            }
        })
    }, [])

    const removeItem = useCallback((itemId: string, itemType?: 'product' | 'drink') => {
        setCart((prev) => ({
            ...prev,
            items: prev.items.filter((item) => item.id !== itemId),
        }))
    }, [])

    const updateItemQuantity = useCallback(
        (itemId: string, quantity: number, itemType?: 'product' | 'drink') => {
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

    const setBuyerPhone = useCallback((phone: string) => {
        setCart((prev) => ({
            ...prev,
            buyerPhone: phone,
        }))
    }, [])

    const setBuyerEmail = useCallback((email: string) => {
        setCart((prev) => ({
            ...prev,
            buyerEmail: email,
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
        setCart((prev) => ({
            items: [],
            buyerName: prev.buyerName,
            buyerPhone: prev.buyerPhone,
            buyerEmail: prev.buyerEmail,
            deliveryAddress: prev.deliveryAddress,
            location: prev.location,
        }))
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
        setBuyerPhone,
        setBuyerEmail,
        setDeliveryAddress,
        setPaymentType,
        getTotal,
        clearCart,
        getItemCount,
    }

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
