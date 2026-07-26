import { CartItem } from '@/types/Order'

/**
 * Calcula el costo total de ingredientes de un item
 */
export function calculateIngredientsTotal(
    item: CartItem
): number {
    if (!('ingredients' in item) || !item.ingredients) {
        return 0
    }

    return item.ingredients.reduce((sum, ing) => sum + ing.price * ing.quantity, 0)
}

/**
 * Calcula el precio unitario de un item con ingredientes
 */
export function calculateItemUnitPrice(item: CartItem): number {
    const ingredientsCost = calculateIngredientsTotal(item)
    return item.price + ingredientsCost
}

/**
 * Calcula el precio total de un item (precio × cantidad)
 */
export function calculateItemTotalPrice(item: CartItem): number {
    return calculateItemUnitPrice(item) * (item.quantity || 1)
}

/**
 * Calcula el total del carrito
 */
export function calculateCartTotal(items: CartItem[]): number {
    return items.reduce((total, item) => total + calculateItemTotalPrice(item), 0)
}

/**
 * Cuenta la cantidad total de items en el carrito
 */
export function countCartItems(items: CartItem[]): number {
    return items.reduce((count, item) => count + (item.quantity || 1), 0)
}

/**
 * Obtiene resumen de la orden para mostrar
 */
export function getOrderSummary(items: CartItem[]) {
    return {
        itemCount: countCartItems(items),
        total: calculateCartTotal(items),
        itemsDetail: items.map((item) => ({
            name: item.name,
            quantity: item.quantity || 1,
            unitPrice: calculateItemUnitPrice(item),
            totalPrice: calculateItemTotalPrice(item),
            hasIngredients: 'ingredients' in item && (item.ingredients?.length || 0) > 0,
            ingredientCount: 'ingredients' in item ? item.ingredients?.length || 0 : 0,
            hasSauces: 'sauces' in item && (item.sauces?.length || 0) > 0,
            sauceCount: 'sauces' in item ? item.sauces?.length || 0 : 0,
        })),
    }
}

/**
 * Valida si la orden puede ser creada
 */
export function validateOrder(
    location: string | undefined,
    items: CartItem[],
    address: string | undefined
): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!location) {
        errors.push('Debes seleccionar una ubicación')
    }

    if (items.length === 0) {
        errors.push('El carrito está vacío')
    }

    if (location === 'delivery' && !address) {
        errors.push('Debes ingresar una dirección de entrega')
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}
