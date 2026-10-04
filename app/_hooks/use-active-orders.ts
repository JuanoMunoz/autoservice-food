'use client'

import { useCallback, useEffect, useState } from 'react'
import { getOrderDetail } from '@/app/(public)/order/actions'
import { OrderResponse, OrderStatus } from '@/types/Order'
import {
    getActiveOrderIds,
    removeActiveOrderId,
} from '@/utils/activeOrderStorage'

const ACTIVE_STATUSES: OrderStatus[] = ['CREATED', 'PREPARING', 'DELIVERING']
const POLL_MS = 20000

export function isActiveStatus(status?: string): boolean {
    return ACTIVE_STATUSES.includes(status as OrderStatus)
}

export function useActiveOrders() {
    const [orders, setOrders] = useState<OrderResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const refresh = useCallback(async () => {
        const ids = getActiveOrderIds()
        if (ids.length === 0) {
            setOrders([])
            setIsLoading(false)
            return
        }
        try {
            const results = await Promise.all(
                ids.map(async (id) => {
                    try {
                        const order = await getOrderDetail(id)
                        if (!order || !isActiveStatus(order.status)) {
                            removeActiveOrderId(id)
                            return null
                        }
                        return order
                    } catch {
                        // 404 u orden inexistente -> limpiar para no mostrar botón muerto
                        removeActiveOrderId(id)
                        return null
                    }
                })
            )
            setOrders(results.filter((o): o is OrderResponse => o !== null))
        } catch (error) {
            console.error('Error refreshing active orders:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        let mounted = true
        // Escucha cambios de otra pestaña / del checkout recién creado
        const onStorage = (e: StorageEvent) => {
            if (e.key === null || e.key === 'cheese-papas-active-orders') {
                refresh()
            }
        }
        const onFocus = () => refresh()
        window.addEventListener('storage', onStorage)
        window.addEventListener('focus', onFocus)
        refresh()
        const interval = setInterval(() => {
            if (mounted) refresh()
        }, POLL_MS)
        return () => {
            mounted = false
            window.removeEventListener('storage', onStorage)
            window.removeEventListener('focus', onFocus)
            clearInterval(interval)
        }
    }, [refresh])

    return { orders, isLoading, refresh, hasActive: orders.length > 0 }
}
