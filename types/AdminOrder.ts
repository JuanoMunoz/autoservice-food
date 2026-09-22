export interface AdminCatalogIngredient {
    id: string
    name: string
    price: number
    type: string
    isTopping: boolean
}

export interface AdminCatalogProductIngredient {
    ingredient: AdminCatalogIngredient
}

export interface AdminCatalogProduct {
    id: string
    name: string
    description: string
    price: number
    productIngredients: AdminCatalogProductIngredient[]
}

export interface AdminCatalogDrink {
    id: string
    name: string
    description: string
    price: number
}

export interface AdminCatalogSauce {
    id: string
    name: string
    hex: string
}

export interface AdminOrderCatalog {
    products: AdminCatalogProduct[]
    drinks: AdminCatalogDrink[]
    sauces: AdminCatalogSauce[]
}

export interface AdminCustomerContact {
    name: string
    phone: string
    email: string
    address: string
    onSite: boolean
}
