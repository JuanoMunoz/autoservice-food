import { Cart } from '@/types/Order'

const CART_STORAGE_KEY = 'cheese-papas-cart'

export function getCartFromStorage(): Cart | null {
    if (typeof window === 'undefined') return null

    try {
        const saved = localStorage.getItem(CART_STORAGE_KEY)
        return saved ? JSON.parse(saved) : null
    } catch (error) {
        console.error('Error loading cart from storage:', error)
        return null
    }
}

export function saveCartToStorage(cart: Cart): void {
    if (typeof window === 'undefined') return

    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    } catch (error) {
        console.error('Error saving cart to storage:', error)
    }
}

export function clearCartFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
        localStorage.removeItem(CART_STORAGE_KEY)
    } catch (error) {
        console.error('Error clearing cart from storage:', error)
    }
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

export function calculateSubtotal(price: number, quantity: number): number {
    return price * quantity
}

export function calculateItemTotal(
    basePrice: number,
    quantity: number,
    ingredientsCost: number = 0
): number {
    return (basePrice + ingredientsCost) * quantity
}

export function calculateTotalWithTax(total: number, taxRate: number = 0): number {
    return total + total * taxRate
}
