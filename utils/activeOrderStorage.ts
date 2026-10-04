interface StoredActiveOrder {
    id: number
    createdAt: number
}

const ACTIVE_ORDERS_KEY = 'cheese-papas-active-orders'
const MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24h de seguridad
const MAX_STORED = 10

function readRaw(): StoredActiveOrder[] {
    if (typeof window === 'undefined') return []
    try {
        const saved = localStorage.getItem(ACTIVE_ORDERS_KEY)
        if (!saved) return []
        const parsed = JSON.parse(saved)
        if (!Array.isArray(parsed)) return []
        return parsed
            .map((e) => (typeof e === 'number' ? { id: e, createdAt: Date.now() } : e))
            .filter((e) => typeof e?.id === 'number' && Number.isFinite(e.id))
    } catch {
        return []
    }
}

function writeRaw(entries: StoredActiveOrder[]): void {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(ACTIVE_ORDERS_KEY, JSON.stringify(entries.slice(0, MAX_STORED)))
    } catch (error) {
        console.error('Error saving active orders:', error)
    }
}

function prune(entries: StoredActiveOrder[]): StoredActiveOrder[] {
    const now = Date.now()
    const seen = new Set<number>()
    return entries.filter((e) => {
        if (seen.has(e.id)) return false
        seen.add(e.id)
        if (now - (e.createdAt || now) > MAX_AGE_MS) return false
        return true
    })
}

export function getActiveOrderIds(): number[] {
    return prune(readRaw()).map((e) => e.id)
}

export function addActiveOrderId(id: number): void {
    if (!Number.isFinite(id)) return
    const entries = prune(readRaw()).filter((e) => e.id !== id)
    entries.unshift({ id, createdAt: Date.now() })
    writeRaw(entries)
}

export function removeActiveOrderId(id: number): void {
    writeRaw(prune(readRaw()).filter((e) => e.id !== id))
}

export function clearActiveOrders(): void {
    if (typeof window === 'undefined') return
    try {
        localStorage.removeItem(ACTIVE_ORDERS_KEY)
    } catch (error) {
        console.error('Error clearing active orders:', error)
    }
}
