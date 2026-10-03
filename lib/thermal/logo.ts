'use client'

/**
 * Logo para la DIG-C58 (58mm = 384 dots).
 * Convierte /logo-factura-print.jpeg a raster 1-bit y lo emite como
 * comando ESC/POS `GS v 0` (raster bit image, máxima compatibilidad).
 * Se procesa una sola vez y se cachea en memoria.
 */

const DOTS_PER_LINE = 384
const MAX_HEIGHT_DOTS = 200
const LOGO_URL = '/logo-factura-print.jpeg'

let cachedRaster: Uint8Array | null = null
let inflight: Promise<Uint8Array | null> | null = null

function luminance(r: number, g: number, b: number): number {
    return 0.299 * r + 0.587 * g + 0.114 * b
}

async function decodeToBitmap(blob: Blob): Promise<{ w: number; h: number; data: Uint8ClampedArray }> {
    const bmp = await createImageBitmap(blob)
    try {
        const scale = Math.min(DOTS_PER_LINE / bmp.width, MAX_HEIGHT_DOTS / bmp.height, 1)
        const w = Math.max(8, Math.round(bmp.width * scale))
        const h = Math.max(8, Math.round(bmp.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) throw new Error('Sin contexto 2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(bmp, 0, 0, w, h)
        const img = ctx.getImageData(0, 0, w, h)
        return { w, h, data: img.data }
    } finally {
        bmp.close()
    }
}

/** Raster 1-bit centrado: [ESC @][ESC a 1][GS v 0 ...][LF][ESC a 0] */
function encodeRasterGSv0(w: number, h: number, px: Uint8ClampedArray): Uint8Array {
    const bytesPerRow = Math.ceil(w / 8)
    const out: number[] = [0x1b, 0x40, 0x1b, 0x61, 0x01]
    const xL = bytesPerRow & 0xff
    const xH = (bytesPerRow >> 8) & 0xff
    const yL = h & 0xff
    const yH = (h >> 8) & 0xff
    out.push(0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH)
    for (let y = 0; y < h; y++) {
        for (let bx = 0; bx < bytesPerRow; bx++) {
            let byte = 0
            for (let bit = 0; bit < 8; bit++) {
                const x = bx * 8 + bit
                let black = false
                if (x < w) {
                    const i = (y * w + x) * 4
                    black = luminance(px[i], px[i + 1], px[i + 2]) < 128
                }
                if (black) byte |= 0x80 >> bit
            }
            out.push(byte)
        }
    }
    out.push(0x0a, 0x1b, 0x61, 0x00)
    return new Uint8Array(out)
}

export function buildLogoRaster(): Promise<Uint8Array | null> {
    if (cachedRaster) return Promise.resolve(cachedRaster)
    if (inflight) return inflight
    inflight = (async () => {
        try {
            if (typeof createImageBitmap === 'undefined') return null
            const res = await fetch(LOGO_URL, { cache: 'force-cache' })
            if (!res.ok) return null
            const { w, h, data } = await decodeToBitmap(await res.blob())
            cachedRaster = encodeRasterGSv0(w, h, data)
            return cachedRaster
        } catch {
            // Sin logo: el ticket sale solo en texto (no se cachea el fallo)
            return null
        } finally {
            inflight = null
        }
    })()
    return inflight
}
