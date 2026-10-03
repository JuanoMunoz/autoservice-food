'use client'

import type { OrderResponse } from '@/types/Order'
import { buildReceiptBytes, receiptBytesToBase64 } from '@/lib/thermal/receipt'

/**
 * Puente RawBT (ru.a402d.rawbtprinter) para la DIG-C58 por SPP clásico.
 * La PWA genera el ESC/POS y lo entrega a RawBT, que lo quema por Bluetooth.
 * Docs: rawbt.ru/intents.html — esquema `rawbt:base64,<b64>` con ACTION_VIEW.
 */

export const RAWBT_PACKAGE = 'ru.a402d.rawbtprinter'
export const RAWBT_PLAY_URL =
    'https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter'

function orderToBase64(order: OrderResponse): string {
    // Sin saltos: Base64.DEFAULT mete \n cada 76 chars y rompería el intent
    return receiptBytesToBase64(buildReceiptBytes(order)).replace(/\s+/g, '')
}

/**
 * URL `rawbt:` directa, SIN fallback.
 * Para intentos automáticos (polling sin gesto): si Chrome la bloquea o
 * RawBT falta, no navega a ningún lado ni rompe el dashboard.
 */
export function buildRawbtSchemeUrl(order: OrderResponse): string {
    return `rawbt:base64,${orderToBase64(order)}`
}

/**
 * Intent completo CON fallback a Play Store.
 * Solo para botones manuales (el tap es gesto válido y Chrome lo permite).
 */
export function buildRawbtIntentUrl(order: OrderResponse): string {
    const b64 = orderToBase64(order)
    const fallback = encodeURIComponent(RAWBT_PLAY_URL)
    return (
        `intent:base64,${b64}#Intent;` +
        `scheme=rawbt;package=${RAWBT_PACKAGE};` +
        `S.browser_fallback_url=${fallback};end;`
    )
}

function fireUrl(url: string) {
    const a = document.createElement('a')
    a.href = url
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    // Limpieza diferida: algunos WebViews resuelven el intent async
    setTimeout(() => a.remove(), 1000)
}

/** Intento automático silencioso (puede ser ignorado sin gesto: es esperado). */
export function tryAutoPrintRawbt(order: OrderResponse): void {
    fireUrl(buildRawbtSchemeUrl(order))
}

/** Impresión manual con fallback a Play Store si RawBT no está instalado. */
export function printOrderViaRawbt(order: OrderResponse): void {
    fireUrl(buildRawbtIntentUrl(order))
}
