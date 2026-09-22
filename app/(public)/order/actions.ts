'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@/lib/generated/prisma/client'
import { OrderDetails, OrderResponse, OrderStatus, DeliveryFeeCalculationResult } from '@/types/Order'

export async function getProducts() {
    try {
        return await prisma.products.findMany({
            include: {
                productIngredients: {
                    include: {
                        ingredient: true,
                    },
                },
            },
        })
    } catch (error) {
        console.error('Error fetching products:', error)
        throw new Error('Failed to fetch products')
    }
}

export async function getDrinks() {
    try {
        return await prisma.drink.findMany()
    } catch (error) {
        console.error('Error fetching drinks:', error)
        throw new Error('Failed to fetch drinks')
    }
}

export async function getActiveTableByNumber(number: number) {
    const table = await prisma.table.findUnique({ where: { number } })
    if (!table || !table.active) return null
    return table
}

export async function getSauces() {
    try {
        return await prisma.sauce.findMany()
    } catch (error) {
        console.error('Error fetching sauces:', error)
        throw new Error('Failed to fetch sauces')
    }
}

export async function getIngredients() {
    try {
        return await prisma.ingredients.findMany()
    } catch (error) {
        console.error('Error fetching ingredients:', error)
        throw new Error('Failed to fetch ingredients')
    }
}

export async function calculateHaversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): Promise<number> {
    const R = 6371 // Radio terrestre en kilómetros
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLng = (lng2 - lng1) * (Math.PI / 180)

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

export async function calculateDeliveryFee(
    coords?: { lat: number; lng: number } | null
): Promise<DeliveryFeeCalculationResult> {
    try {
        const configs = await prisma.configuration.findMany({
            where: {
                name: {
                    in: [
                        'DOMICILIO',
                        'LATITUD',
                        'LONGITUD',
                        'KM_ADICIONAL',
                        'KM_INCLUIDOS_DOMICILIO',
                    ],
                    mode: 'insensitive',
                },
                active: true,
            },
        })

        const configMap = new Map<string, number>()
        configs.forEach((cfg) => {
            const parsed = parseFloat(cfg.value)
            if (!isNaN(parsed)) {
                configMap.set(cfg.name.toUpperCase(), parsed)
            }
        })

        const baseFee = configMap.get('DOMICILIO') ?? 0
        const businessLat = configMap.get('LATITUD')
        const businessLng = configMap.get('LONGITUD')
        const kmAdicional = configMap.get('KM_ADICIONAL') ?? 0
        const kmIncluidos = configMap.get('KM_INCLUIDOS_DOMICILIO') ?? 0

        if (baseFee < 0 || kmAdicional < 0 || kmIncluidos < 0) {
            throw new Error('Configuración de domicilio numéricamente inválida en la base de datos.')
        }

        if (
            !coords ||
            typeof coords.lat !== 'number' ||
            typeof coords.lng !== 'number' ||
            isNaN(coords.lat) ||
            isNaN(coords.lng) ||
            coords.lat < -90 ||
            coords.lat > 90 ||
            coords.lng < -180 ||
            coords.lng > 180 ||
            businessLat === undefined ||
            businessLng === undefined ||
            isNaN(businessLat) ||
            isNaN(businessLng) ||
            businessLat < -90 ||
            businessLat > 90 ||
            businessLng < -180 ||
            businessLng > 180
        ) {
            return {
                fee: Math.round(baseFee),
                distanceKm: 0,
                isBaseKm: true,
                extraKm: 0,
                baseFee: Math.round(baseFee),
                extraKmFee: 0,
            }
        }

        const distanceKmRaw = await calculateHaversineDistance(
            businessLat,
            businessLng,
            coords.lat,
            coords.lng
        )
        const distanceKm = Math.round(distanceKmRaw * 100) / 100

        if (distanceKmRaw <= kmIncluidos) {
            return {
                fee: Math.round(baseFee),
                distanceKm,
                isBaseKm: true,
                extraKm: 0,
                baseFee: Math.round(baseFee),
                extraKmFee: 0,
            }
        } else {
            const extraKm = distanceKmRaw - kmIncluidos
            const extraKmFee = extraKm * kmAdicional
            const totalFee = baseFee + extraKmFee

            return {
                fee: Math.round(totalFee),
                distanceKm,
                isBaseKm: false,
                extraKm: Math.round(extraKm * 100) / 100,
                baseFee: Math.round(baseFee),
                extraKmFee: Math.round(extraKmFee),
            }
        }
    } catch (error: any) {
        console.error('Error calculating dynamic delivery fee:', error)
        return {
            fee: 0,
            distanceKm: 0,
            isBaseKm: true,
            extraKm: 0,
            baseFee: 0,
            extraKmFee: 0,
            error: error.message || 'Error al calcular tarifa de domicilio',
        }
    }
}

export async function getDeliveryFee(): Promise<number> {
    try {
        const result = await calculateDeliveryFee(null)
        return result.fee
    } catch (error) {
        console.error('Error fetching delivery fee:', error)
        return 0
    }
}

export async function getProductDetail(id: string) {
    try {
        const product = await prisma.products.findUnique({
            where: { id },
            include: {
                productIngredients: {
                    include: {
                        ingredient: true,
                    },
                },
            },
        })

        if (!product) {
            throw new Error('Product not found')
        }

        return product
    } catch (error) {
        console.error('Error fetching product detail:', error)
        throw new Error('Failed to fetch product detail')
    }
}

export async function getDrinkDetail(id: string) {
    try {
        const drink = await prisma.drink.findUnique({
            where: { id },
        })

        if (!drink) {
            throw new Error('Drink not found')
        }

        return drink
    } catch (error) {
        console.error('Error fetching drink detail:', error)
        throw new Error('Failed to fetch drink detail')
    }
}

export async function createOrder(details: OrderDetails): Promise<OrderResponse> {
    try {
        if (details.tableId) {
            const table = await prisma.table.findFirst({
                where: { id: details.tableId, active: true },
                select: { id: true },
            })
            if (!table) throw new Error('Table not found or inactive')
        }

        // Calculate backend items total
        let itemsSubtotal = 0
        for (const item of details.items) {
            let itemPrice = Number(item.price) || 0
            let extrasTotal = 0
            if ('ingredients' in item && item.ingredients) {
                extrasTotal = item.ingredients.reduce(
                    (sum, ing) => sum + (Number(ing.price) || 0) * (ing.quantity || 1),
                    0
                )
            }
            itemsSubtotal += (itemPrice + extrasTotal) * (item.quantity || 1)
        }

        let calculatedDeliveryFee = 0
        if (details.location === 'delivery') {
            const feeResult = await calculateDeliveryFee(details.deliveryAddress?.coordinates)
            calculatedDeliveryFee = feeResult.fee
        }

        const backendCalculatedTotal = itemsSubtotal + calculatedDeliveryFee

        const order = await prisma.order.create({
            data: {
                total: new Prisma.Decimal(backendCalculatedTotal),
                onSite: details.location === 'onSite',
                address: details.deliveryAddress?.street || '',
                buyerName: details.buyerName,
                buyerPhone: details.buyerPhone,
                buyerEmail: details.buyerEmail || null,
                tableId: details.tableId || null,
                status: 'CREATED',
                items: {
                    create: details.items.map((item) => ({
                        quantity: item.quantity || 1,
                        unitPrice: new Prisma.Decimal(item.price),
                        ...(item.type === 'product'
                            ? { productId: (item as any).productId || item.id }
                            : { drinkId: (item as any).drinkId || item.id }),
                        ...('ingredients' in item && item.ingredients
                            ? {
                                extras: {
                                    create: item.ingredients.map((ing) => ({
                                        ingredientId: ing.id,
                                        quantity: ing.quantity || 1,
                                        unitPrice: new Prisma.Decimal(ing.price),
                                    })),
                                },
                            }
                            : {}),
                        ...('sauces' in item && item.sauces
                            ? {
                                sauces: {
                                    create: item.sauces.map((sauce) => ({
                                        sauceId: sauce.id,
                                    })),
                                },
                            }
                            : {}),
                    })),
                },
            },
        })

        const fullOrder = await getOrderDetail(order.id)
        return fullOrder
    } catch (error) {
        console.error('Error creating order:', error)
        throw new Error('Failed to create order')
    }
}

export async function getOrderDetail(orderId: number): Promise<OrderResponse> {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                table: true,
                items: {
                    include: {
                        product: true,
                        drink: true,
                        sauces: {
                            include: {
                                sauce: true,
                            },
                        },
                        extras: {
                            include: {
                                ingredient: true,
                            },
                        },
                    },
                },
            },
        })

        if (!order) {
            throw new Error('Order not found')
        }

        return {
            id: order.id,
            total: order.total.toString(),
            onSite: order.onSite,
            address: order.address,
            buyerName: order.buyerName,
            buyerPhone: order.buyerPhone || undefined,
            buyerEmail: order.buyerEmail || undefined,
            status: order.status as any,
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
            table: order.table
                ? { id: order.table.id, number: order.table.number, name: order.table.name }
                : null,
            items: order.items.map((item) => ({
                id: item.id,
                quantity: item.quantity,
                unitPrice: item.unitPrice.toString(),
                product: item.product
                    ? {
                        id: item.product.id,
                        name: item.product.name,
                        description: item.product.description,
                        imageRoute: item.product.imageRoute || undefined,
                        price: item.product.price.toString(),
                    }
                    : null,
                drink: item.drink
                    ? {
                        id: item.drink.id,
                        name: item.drink.name,
                        description: item.drink.description,
                        imageRoute: item.drink.imageRoute || undefined,
                        price: item.drink.price.toString(),
                    }
                    : null,
                sauces: item.sauces.map((s) => ({
                    sauce: {
                        id: s.sauce.id,
                        name: s.sauce.name,
                        hex: s.sauce.hex,
                    },
                })),
                extras: item.extras.map((ex) => ({
                    quantity: ex.quantity,
                    unitPrice: ex.unitPrice.toString(),
                    ingredient: {
                        id: ex.ingredient.id,
                        name: ex.ingredient.name,
                        price: ex.ingredient.price.toString(),
                    },
                })),
            })),
        }
    } catch (error) {
        console.error('Error fetching order detail:', error)
        throw new Error('Failed to fetch order detail')
    }
}

export async function getAllActiveOrders(): Promise<OrderResponse[]> {
    try {
        const orders = await prisma.order.findMany({
            where: {
                status: {
                    in: ['CREATED', 'PREPARING', 'DELIVERING'],
                },
            },
            orderBy: {
                createdAt: 'asc', // FIFO (First In First Out)
            },
            include: {
                table: true,
                items: {
                    include: {
                        product: true,
                        drink: true,
                        sauces: {
                            include: {
                                sauce: true,
                            },
                        },
                        extras: {
                            include: {
                                ingredient: true,
                            },
                        },
                    },
                },
            },
        })

        return orders.map((order) => ({
            id: order.id,
            total: order.total.toString(),
            onSite: order.onSite,
            address: order.address,
            buyerName: order.buyerName,
            buyerPhone: order.buyerPhone || undefined,
            buyerEmail: order.buyerEmail || undefined,
            status: order.status as any,
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
            table: order.table
                ? { id: order.table.id, number: order.table.number, name: order.table.name }
                : null,
            items: order.items.map((item) => ({
                id: item.id,
                quantity: item.quantity,
                unitPrice: item.unitPrice.toString(),
                product: item.product
                    ? {
                        id: item.product.id,
                        name: item.product.name,
                        description: item.product.description,
                        imageRoute: item.product.imageRoute || undefined,
                        price: item.product.price.toString(),
                    }
                    : null,
                drink: item.drink
                    ? {
                        id: item.drink.id,
                        name: item.drink.name,
                        description: item.drink.description,
                        imageRoute: item.drink.imageRoute || undefined,
                        price: item.drink.price.toString(),
                    }
                    : null,
                sauces: item.sauces.map((s) => ({
                    sauce: {
                        id: s.sauce.id,
                        name: s.sauce.name,
                        hex: s.sauce.hex,
                    },
                })),
                extras: item.extras.map((ex) => ({
                    quantity: ex.quantity,
                    unitPrice: ex.unitPrice.toString(),
                    ingredient: {
                        id: ex.ingredient.id,
                        name: ex.ingredient.name,
                        price: ex.ingredient.price.toString(),
                    },
                })),
            })),
        }))
    } catch (error) {
        console.error('Error fetching active orders:', error)
        return []
    }
}

export async function updateOrderStatus(orderId: number, status: OrderStatus): Promise<OrderResponse> {
    try {
        await prisma.order.update({
            where: { id: orderId },
            data: { status },
        })

        const updated = await getOrderDetail(orderId)
        return updated
    } catch (error) {
        console.error('Error updating order status:', error)
        throw new Error('Failed to update order status')
    }
}

export async function cancelOrder(orderId: number) {
    try {
        const updated = await updateOrderStatus(orderId, 'CANCELLED')
        return updated
    } catch (error) {
        console.error('Error canceling order:', error)
        throw new Error('Failed to cancel order')
    }
}
