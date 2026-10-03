'use client'

import type { OrderResponse } from '@/types/Order'

/** Ancho ticket 58mm en Font A: 32 columnas */
export const THERMAL_COLS = 32

const ESC = 0x1b
const GS = 0x1d
const LF = 0x0a

function formatCOP(value: number): string {
    if (!Number.isFinite(value)) return '$ 0'
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

/**
 * Translitera a latin-1 imprimible por la DIG-C58.
 * Conserva ñ/Ñ e invertebrados comunes; elimina emojis y símbolos raros.
 */
export function sanitizeThermalText(input: string): string {
    return (
        input
            // guiones y comillas tipográficas
            .replace(/[–—―]/g, '-')
            .replace(/[‘’‚‛]/g, "'")
            .replace(/[“”„]/g, '"')
            .replace(/[…]/g, '...')
            .replace(/[•·]/g, '*')
            .replace(/[✓✔]/g, 'v')
            // placeholder para ñ/Ñ antes de descomponer
            .replace(/ñ/g, '\u0001')
            .replace(/Ñ/g, '\u0002')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(//g, 'ñ')
            .replace(//g, 'Ñ')
            // fuera de latin-1 -> '?', salvo saltos ya separados
            .split('')
            .map((ch) => {
                if (ch === '\n') return ch
                const code = ch.charCodeAt(0)
                if (code >= 32 && code <= 255 && code !== 127) return ch
                return ''
            })
            .join('')
    )
}

function encodeLatin1(text: string): number[] {
    const out: number[] = []
    for (const ch of sanitizeThermalText(text)) {
        if (ch === '\n') {
            out.push(LF)
            continue
        }
        out.push(ch.charCodeAt(0) & 0xff)
    }
    return out
}

class ReceiptBuilder {
    private bytes: number[] = []

    raw(...b: number[]) {
        this.bytes.push(...b)
        return this
    }

    text(str: string) {
        this.bytes.push(...encodeLatin1(str))
        return this
    }

    line(str = '') {
        this.text(str)
        this.bytes.push(LF)
        return this
    }

    align(n: 0 | 1 | 2) {
        return this.raw(ESC, 0x61, n)
    }

    bold(on: boolean) {
        return this.raw(ESC, 0x45, on ? 1 : 0)
    }

    /** n: 0 normal, 0x11 doble alto+ancho */
    size(n: number) {
        return this.raw(GS, 0x21, n)
    }

    feed(n = 3) {
        return this.raw(ESC, 0x64, n)
    }

    cut() {
        // Corte parcial; en equipos de corte manual es inocuo
        return this.raw(GS, 0x56, 0x01)
    }

    build(): Uint8Array {
        return new Uint8Array(this.bytes)
    }
}

function centered(b: ReceiptBuilder, str: string) {
    b.align(1).line(str).align(0)
}

function separator(b: ReceiptBuilder, char = '-') {
    b.line(char.repeat(THERMAL_COLS))
}

/** Izquierda + derecha en líneas de 32 cols (parte la izquierda si no cabe) */
function pairLine(b: ReceiptBuilder, left: string, right: string) {
    const l = sanitizeThermalText(left)
    const r = sanitizeThermalText(right)
    if (l.length + r.length + 1 < THERMAL_COLS) {
        b.line(l + ' '.repeat(THERMAL_COLS - l.length - r.length) + r)
        return
    }
    wrapLine(b, l)
    b.align(2).line(r).align(0)
}

/** Envuelve texto largo en líneas de 32 cols */
function wrapLine(b: ReceiptBuilder, str: string, prefix = '') {
    const clean = sanitizeThermalText(str)
    const width = THERMAL_COLS - prefix.length
    let rest = clean
    let first = true
    while (rest.length > 0) {
        let chunk = rest.slice(0, width)
        rest = rest.slice(width)
        // evita cortar palabras cuando sobra poco
        if (rest.length > 0 && chunk.length === width) {
            const lastSpace = chunk.lastIndexOf(' ')
            if (lastSpace > width - 10 && lastSpace > 0) {
                rest = chunk.slice(lastSpace + 1) + rest
                chunk = chunk.slice(0, lastSpace)
            }
        }
        b.line((first ? prefix : ' '.repeat(prefix.length)) + chunk)
        first = false
    }
}

function safeNumber(str: string | undefined): number {
    const n = parseFloat(str || '0')
    return Number.isFinite(n) ? n : 0
}

/**
 * Genera los bytes ESC/POS del comprobante para la DIG-C58 (58mm).
 * Espejo en texto de InvoiceReceipt.tsx, sin logo ni emojis.
 */
export function buildReceiptBytes(order: OrderResponse): Uint8Array {
    const b = new ReceiptBuilder()
    const invoiceNumber = `CP-${order.id.toString().padStart(6, '0')}`

    b.raw(ESC, 0x40) // INIT
    b.raw(ESC, 0x74, 16) // codepage WPC1252

    // Encabezado
    centered(b, 'CHEESEPAPAS')
    centered(b, 'Autoservicio Comida Rapida')
    b.bold(true)
    centered(b, `Factura ${invoiceNumber}`)
    b.bold(false)
    separator(b)

    // Meta
    const d = new Date(order.createdAt)
    const fecha = Number.isNaN(d.getTime())
        ? ''
        : `${d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })} ${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`
    if (fecha) pairLine(b, 'Fecha:', fecha)
    pairLine(b, 'Orden:', `#${order.id}`)
    wrapLine(b, `Cliente: ${order.buyerName || 'Cliente Kiosko'}`)
    if (order.buyerPhone) pairLine(b, 'Tel:', order.buyerPhone)
    pairLine(b, 'Servicio:', order.onSite ? 'En local' : 'Domicilio')
    if (order.table) wrapLine(b, `Mesa: ${order.table.name || `Mesa ${order.table.number}`}`)
    if (!order.onSite && order.address) wrapLine(b, `Dir: ${order.address}`)
    separator(b)

    // Ítems
    b.bold(true).line('CANT  PRODUCTO')
    b.bold(false)
    separator(b, '.')
    const items = order.items || []
    if (items.length === 0) {
        centered(b, 'Sin productos registrados')
    }
    for (const item of items) {
        const name = item.product?.name || item.drink?.name || 'Producto'
        const unit = safeNumber(item.unitPrice)
        const total = unit * item.quantity
        pairLine(b, `${item.quantity}x ${name}`, formatCOP(total))
        // si el nombre era largo, pairLine ya lo partió en 2 líneas
        b.align(2).line(`c/u ${formatCOP(unit)}`).align(0)
        for (const ex of item.extras || []) {
            pairLine(b, `  + ${ex.ingredient.name}`, formatCOP(safeNumber(ex.ingredient.price)))
        }
        if (item.sauces && item.sauces.length > 0) {
            wrapLine(b, `Salsas: ${item.sauces.map((s) => s.sauce.name).join(', ')}`, '  ')
        }
    }
    separator(b)

    // Totales
    const totalNum = safeNumber(order.total)
    pairLine(b, 'Subtotal:', formatCOP(totalNum))
    if (!order.onSite) pairLine(b, 'Domicilio:', 'INCLUIDO')
    b.bold(true).size(0x11)
    centered(b, 'TOTAL A PAGAR')
    centered(b, formatCOP(totalNum))
    b.size(0).bold(false)
    centered(b, 'Estado: PAGADO')
    separator(b)

    // Pie
    centered(b, 'GRACIAS POR TU COMPRA!')
    centered(b, 'Tel: +57 310 3967137')
    centered(b, 'Cuando pienses en papas')
    centered(b, 'piensa en cheesepapas')
    centered(b, 'www.cheesepapas.com')

    b.feed(4).cut()
    return b.build()
}

/** bytes -> base64 (para intents RawBT u otros puentes) */
export function receiptBytesToBase64(bytes: Uint8Array): string {
    let binary = ''
    const CHUNK = 0x8000
    for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
    }
    return btoa(binary)
}
