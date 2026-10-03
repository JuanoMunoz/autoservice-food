'use client'

/**
 * Transporte WebBluetooth BLE para la DIG-C58.
 * Servicios observados en nRF: 0xFF10 / 0xFF12 / 49535343-fe7d-…
 * Características escribibles: …ff11 [W WNR] y 49535343-8841-… [W WNR].
 */

export const PRINTER_SERVICE_UUIDS: Array<string | number> = [
    0xff10,
    0xff12,
    '49535343-fe7d-4ae5-8fa9-9fafd205e455',
]

const PREFERRED_CHAR_MATCHERS = ['ff11', '49535343-8841']

export const BLE_CHUNK_SIZE = 100
export const BLE_CHUNK_DELAY_MS = 30

export function isWebBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && !!(navigator as Navigator & { bluetooth?: unknown }).bluetooth
}

type AnyBluetoothDevice = {
    id: string
    name?: string
    gatt?: {
        connect(): Promise<AnyGattServer>
        connected: boolean
        disconnect(): void
    }
    addEventListener(type: string, listener: () => void): void
}

type AnyGattServer = {
    connected: boolean
    disconnect(): void
    getPrimaryServices(): Promise<Array<{ getCharacteristics(): Promise<AnyChar[]> }>>
}

type AnyChar = {
    uuid: string
    properties: { write?: boolean; writeWithoutResponse?: boolean }
    writeValueWithoutResponse?(data: BufferSource): Promise<void>
    writeValue?(data: BufferSource): Promise<void>
}

function scoreCharacteristic(uuid: string): number {
    const lower = uuid.toLowerCase()
    for (let i = 0; i < PREFERRED_CHAR_MATCHERS.length; i++) {
        if (lower.includes(PREFERRED_CHAR_MATCHERS[i])) return 100 - i
    }
    return 1
}

async function findWritableCharacteristic(
    server: AnyGattServer,
): Promise<AnyChar> {
    const services = await server.getPrimaryServices()
    let fallback: AnyChar | null = null
    let fallbackScore = -1
    for (const service of services) {
        let chars: AnyChar[]
        try {
            chars = await service.getCharacteristics()
        } catch {
            continue
        }
        for (const char of chars) {
            const canWrite = char.properties.write || char.properties.writeWithoutResponse
            if (!canWrite) continue
            const score = scoreCharacteristic(char.uuid)
            if (score >= 100) return char
            if (score > fallbackScore) {
                fallback = char
                fallbackScore = score
            }
        }
    }
    if (fallback) return fallback
    throw new Error('La impresora no expuso características escribibles (W).')
}

export interface BlePrinterHandle {
    deviceId: string
    deviceName: string
    print: (bytes: Uint8Array) => Promise<void>
    disconnect: () => void
}

function getBluetooth(): {
    requestDevice(opts: unknown): Promise<AnyBluetoothDevice>
    getDevices(): Promise<AnyBluetoothDevice[]>
} {
    const nav = navigator as Navigator & {
        bluetooth?: {
            requestDevice(opts: unknown): Promise<AnyBluetoothDevice>
            getDevices(): Promise<AnyBluetoothDevice[]>
        }
    }
    if (!nav.bluetooth) throw new Error('WebBluetooth no disponible en este navegador.')
    return nav.bluetooth
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

async function writeChunked(char: AnyChar, bytes: Uint8Array) {
    const canNoResponse = char.properties.writeWithoutResponse && char.writeValueWithoutResponse
    for (let i = 0; i < bytes.length; i += BLE_CHUNK_SIZE) {
        const chunk = bytes.slice(i, i + BLE_CHUNK_SIZE)
        // Copia a ArrayBuffer fresco: algunos stacks BLE rechazan views con offset
        const payload = chunk.slice().buffer as ArrayBuffer
        if (canNoResponse) {
            await char.writeValueWithoutResponse!(payload)
        } else if (char.writeValue) {
            await char.writeValue(payload)
        } else {
            throw new Error('Característica sin método de escritura.')
        }
        if (i + BLE_CHUNK_SIZE < bytes.length) await delay(BLE_CHUNK_DELAY_MS)
    }
}

async function connectDevice(
    device: AnyBluetoothDevice,
    onDisconnect?: () => void,
): Promise<BlePrinterHandle> {
    if (!device.gatt) throw new Error('El dispositivo no soporta GATT.')
    const server = await device.gatt.connect()
    const char = await findWritableCharacteristic(server)

    if (onDisconnect) {
        device.addEventListener('gattserverdisconnected', onDisconnect)
    }

    let printing = false
    return {
        deviceId: device.id,
        deviceName: device.name || 'Impresora BLE',
        print: async (bytes: Uint8Array) => {
            if (printing) throw new Error('Ya hay una impresión en curso.')
            if (!server.connected) throw new Error('Impresora desconectada. Vuelve a conectar.')
            printing = true
            try {
                await writeChunked(char, bytes)
            } finally {
                printing = false
            }
        },
        disconnect: () => {
            try {
                if (server.connected) server.disconnect()
            } catch {
                /* noop */
            }
        },
    }
}

/** Debe llamarse desde un gesto (tap en "Conectar"). Muestra el selector del sistema. */
export async function requestBlePrinter(onDisconnect?: () => void): Promise<BlePrinterHandle> {
    const bt = getBluetooth()
    const device = await bt.requestDevice({
        filters: [
            { namePrefix: 'PRINTER' },
            { namePrefix: 'DIG' },
            { namePrefix: 'MPT' },
            { namePrefix: 'POS' },
            { namePrefix: 'RPP' },
            { namePrefix: 'ZJ' },
        ],
        optionalServices: PRINTER_SERVICE_UUIDS,
    })
    return connectDevice(device, onDisconnect)
}

/** Dispositivos ya autorizados: permite reconectar sin selector. */
export async function getKnownBleDevices(): Promise<Array<{ id: string; name: string }>> {
    try {
        const bt = getBluetooth()
        if (!bt.getDevices) return []
        const devices = await bt.getDevices()
        return devices.map((d) => ({ id: d.id, name: d.name || 'Impresora BLE' }))
    } catch {
        return []
    }
}

export async function reconnectKnownBleDevice(
    deviceId: string,
    onDisconnect?: () => void,
): Promise<BlePrinterHandle | null> {
    try {
        const bt = getBluetooth()
        if (!bt.getDevices) return null
        const devices = await bt.getDevices()
        const found = devices.find((d) => d.id === deviceId)
        if (!found) return null
        return connectDevice(found, onDisconnect)
    } catch {
        return null
    }
}
