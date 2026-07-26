import { EventEmitter } from 'events'
import { OrderResponse } from '@/types/Order'

type OrderEventMap = {
    'order-created': [order: OrderResponse]
    'order-updated': [order: OrderResponse]
    'order-update': [{ id: number; status: string; order?: OrderResponse }]
}

class TypedEventEmitter extends EventEmitter {
    emit<K extends keyof OrderEventMap>(event: K, ...args: OrderEventMap[K]): boolean {
        return super.emit(event, ...args)
    }

    on<K extends keyof OrderEventMap>(event: K, listener: (...args: OrderEventMap[K]) => void): this {
        return super.on(event, listener as (...args: any[]) => void)
    }

    off<K extends keyof OrderEventMap>(event: K, listener: (...args: OrderEventMap[K]) => void): this {
        return super.off(event, listener as (...args: any[]) => void)
    }
}

const globalForEvents = globalThis as unknown as {
    orderEventEmitter: TypedEventEmitter | undefined
}

export const orderEventEmitter =
    globalForEvents.orderEventEmitter ?? new TypedEventEmitter()

orderEventEmitter.setMaxListeners(100)

if (process.env.NODE_ENV !== 'production') {
    globalForEvents.orderEventEmitter = orderEventEmitter
}
