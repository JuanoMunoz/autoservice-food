import { NextRequest } from 'next/server'
import { orderEventEmitter } from '@/lib/events'
import { OrderResponse } from '@/types/Order'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
        start(controller) {
            // Initial connection
            controller.enqueue(
                encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: 'Connected to KDS SSE stream', time: new Date().toISOString() })}\n\n`)
            )

            // Listener for newly created orders
            const handleOrderCreated = (order: OrderResponse) => {
                try {
                    const payload = `event: order-created\ndata: ${JSON.stringify(order)}\n\n`
                    controller.enqueue(encoder.encode(payload))
                } catch (err) {
                    console.error('Error enqueueing order-created SSE event:', err)
                }
            }

            // Listener for updated orders
            const handleOrderUpdated = (order: OrderResponse) => {
                try {
                    const payloadUpdated = `event: order-updated\ndata: ${JSON.stringify(order)}\n\n`
                    const payloadUpdate = `event: order-update\ndata: ${JSON.stringify({ id: order.id, status: order.status, order })}\n\n`
                    controller.enqueue(encoder.encode(payloadUpdated))
                    controller.enqueue(encoder.encode(payloadUpdate))
                } catch (err) {
                    console.error('Error enqueueing order-updated SSE event:', err)
                }
            }

            const handleOrderUpdate = (data: { id: number; status: string; order?: OrderResponse }) => {
                try {
                    const payload = `event: order-update\ndata: ${JSON.stringify(data)}\n\n`
                    controller.enqueue(encoder.encode(payload))
                } catch (err) {
                    console.error('Error enqueueing order-update SSE event:', err)
                }
            }

            orderEventEmitter.on('order-created', handleOrderCreated)
            orderEventEmitter.on('order-updated', handleOrderUpdated)
            orderEventEmitter.on('order-update', handleOrderUpdate)

            // Heartbeat to keep connection alive
            const heartbeatInterval = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(`: ping\n\n`))
                } catch {
                    // Closed stream
                }
            }, 15000)

            req.signal.addEventListener('abort', () => {
                clearInterval(heartbeatInterval)
                orderEventEmitter.off('order-created', handleOrderCreated)
                orderEventEmitter.off('order-updated', handleOrderUpdated)
                orderEventEmitter.off('order-update', handleOrderUpdate)
                try {
                    controller.close()
                } catch {
                    // Closed stream
                }
            })
        },
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    })
}