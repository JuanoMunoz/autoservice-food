export type LocationType = 'onSite' | 'delivery'
export type PaymentType = 'cash' | 'card' | 'transfer'
export type OrderStatus = 'CREATED' | 'PREPARING' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED'

export interface CartIngredient {
    id: string
    name: string
    price: number
    quantity: number
}

export interface CartSauce {
    id: string
    name: string
    hex: string
}

export interface CartProduct {
    type: 'product'
    id: string
    name: string
    description: string
    imageRoute?: string
    price: number
    quantity: number
    ingredients: CartIngredient[]
    sauces: CartSauce[]
}

export interface CartDrink {
    type: 'drink'
    id: string
    name: string
    description: string
    imageRoute?: string
    price: number
    quantity: number
}

export type CartItem = CartProduct | CartDrink

export interface DeliveryAddress {
    street: string
    reference: string
    coordinates?: {
        lat: number
        lng: number
    }
}

export interface OrderDetails {
    location: LocationType
    items: CartItem[]
    buyerName?: string
    deliveryAddress?: DeliveryAddress
    paymentType?: PaymentType
    total: number
}

export interface Cart {
    location?: LocationType
    items: CartItem[]
    buyerName?: string
    deliveryAddress?: DeliveryAddress
    paymentType?: PaymentType
}

export interface OrderResponse {
    id: number
    total: string
    onSite: boolean
    address: string
    buyerName?: string
    status: OrderStatus
    createdAt: string
    updatedAt: string
    items?: Array<{
        id: string
        quantity: number
        unitPrice: string
        product?: {
            id: string
            name: string
            description: string
            imageRoute?: string
            price: string
        } | null
        drink?: {
            id: string
            name: string
            description: string
            imageRoute?: string
            price: string
        } | null
        sauces?: Array<{
            sauce: {
                id: string
                name: string
                hex: string
            }
        }>
        extras?: Array<{
            quantity: number
            unitPrice: string
            ingredient: {
                id: string
                name: string
                price: string
            }
        }>
    }>
}


export type ProductDetailed = {
    id: string
    name: string
    description: string
    imageRoute?: string
    price: number
    type: 'product'
    ingredients: CartIngredient[]
    sauces: CartSauce[]
}

export type DrinkDetailed = {
    id: string
    name: string
    description: string
    imageRoute?: string
    price: number
    type: 'drink'
}

export type ItemDetailed = ProductDetailed | DrinkDetailed
