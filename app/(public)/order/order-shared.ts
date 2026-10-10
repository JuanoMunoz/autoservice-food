/**
 * Shared order constants / types / pure helpers.
 *
 * NOTE: This file must NOT contain `'use server'` so it can export
 * constants, interfaces and sync helpers. Server actions in
 * `./actions.ts` import from here instead of defining (and exporting)
 * non-async values, which Next.js forbids in a "use server" module
 * ("Only async functions are allowed to be exported in a use server file").
 */

export const MAX_MANUAL_DELIVERY_FEE = 100000

export interface CreateOrderOptions {
    /**
     * Override manual del domicilio (solo para uso admin: createAdminOrder
     * lo reenvía tras validar rol). El checkout público nunca lo pasa,
     * así que el flujo público sigue 100% automático.
     */
    manualDeliveryFee?: number
}

export function sanitizeManualDeliveryFee(value: unknown): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
    const rounded = Math.round(value)
    if (rounded < 0) return 0
    if (rounded > MAX_MANUAL_DELIVERY_FEE) return MAX_MANUAL_DELIVERY_FEE
    return rounded
}
