'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@/lib/generated/prisma/client'
import { OrderDetails, OrderResponse, OrderStatus } from '@/types/Order'

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

export async function getDeliveryFee(): Promise<number> {
    try {
        const config = await prisma.configuration.findFirst({
            where: {
                name: {
                    equals: 'DOMICILIO',
                    mode: 'insensitive',
                },
                active: true,
            },
        })

        if (!config) return 0
        const parsed = parseFloat(config.value)
        return isNaN(parsed) ? 0 : parsed
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
        const order = await prisma.order.create({
            data: {
                total: new Prisma.Decimal(details.total),
                onSite: details.location === 'onSite',
                address: details.deliveryAddress?.street || '',
                buyerName: details.buyerName,
                status: 'CREATED',
                items: {
                    create: details.items.map((item) => ({
                        quantity: item.quantity || 1,
                        unitPrice: new Prisma.Decimal(item.price),
                        ...(item.type === 'product'
                            ? { productId: item.id }
                            : { drinkId: item.id }),
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
            buyerName: order.buyerName || undefined,
            status: order.status as any,
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
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
            buyerName: order.buyerName || undefined,
            status: order.status as any,
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
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
