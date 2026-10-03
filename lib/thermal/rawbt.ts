'use client'

import type { OrderResponse } from '@/types/Order'
import { buildTicketBytes, receiptBytesToBase64 } from '@/lib/thermal/receipt'

/**
 * Puente RawBT (ru.a402d.rawbtprinter) para la DIG-C58 por SPP clásico.
 * La PWA genera el ESC/POS (logo raster + factura) y lo entrega a RawBT,
 * que lo quema por Bluetooth. Docs: rawbt.ru/intents.html.
 */

export const RAWBT_PACKAGE = 'ru.a402d.rawbtprinter'
export const RAWBT_PLAY_URL =
    'https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter'

function ticketToBase64(bytes: Uint8Array): string {
    // Sin saltos: Base64.DEFAULT mete \n cada 76 chars y rompería el intent
    return receiptBytesToBase64(bytes).replace(/\s+/g, '')
}

/**
 * URL `rawbt:` directa, SIN fallback.
 * Para intentos automáticos (polling sin gesto): si Chrome la bloquea o
 * RawBT falta, no navega a ningún lado ni rompe el dashboard.
 */
export function buildRawbtSchemeUrlFromBytes(bytes: Uint8Array): string {
    return `rawbt:base64,${ticketToBase64(bytes)}`
}

/**
 * Intent completo CON fallback a Play Store.
 * Solo para botones manuales (el tap es gesto válido y Chrome lo permite).
 */
export function buildRawbtIntentUrlFromBytes(bytes: Uint8Array): string {
    const b64 = ticketToBase64(bytes)
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
export async function tryAutoPrintRawbt(order: OrderResponse): Promise<void> {
    fireUrl(buildRawbtSchemeUrlFromBytes(await buildTicketBytes(order)))
}

/** Impresión manual con fallback a Play Store si RawBT no está instalado. */
export async function printOrderViaRawbt(order: OrderResponse): Promise<void> {
    fireUrl(buildRawbtIntentUrlFromBytes(await buildTicketBytes(order)))
}
