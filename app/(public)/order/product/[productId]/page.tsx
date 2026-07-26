import { getProductDetail, getSauces, getIngredients } from '@/app/(public)/order/actions'
import { notFound } from 'next/navigation'
import ProductClient from './_components/productClient'

export async function generateMetadata({ params }: { params: Promise<{ productId: string }> }) {
    const { productId } = await params
    try {
        const product = await getProductDetail(productId)
        return {
            title: `${product.name} | CheesePapas`,
            description: product.description,
        }
    } catch {
        return {
            title: 'Producto | CheesePapas',
        }
    }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
    const { productId } = await params

    try {
        const [product, sauces, allIngredients] = await Promise.all([
            getProductDetail(productId),
            getSauces(),
            getIngredients(),
        ])

        const ingredientsMap = new Map<string, any>()

        // 1. Add ingredients assigned to this product
        if (product.productIngredients) {
            for (const pi of product.productIngredients) {
                if (pi.ingredient) {
                    ingredientsMap.set(pi.ingredient.id, pi.ingredient)
                }
            }
        }

        // 2. Add all global ingredients marked with isTopping === true
        for (const ing of allIngredients) {
            if (ing.isTopping && !ingredientsMap.has(ing.id)) {
                ingredientsMap.set(ing.id, ing)
            }
        }

        const formattedProduct = {
            id: product.id,
            name: product.name,
            description: product.description,
            imageRoute: product.imageRoute || undefined,
            price: product.price.toString(),
            productIngredients: Array.from(ingredientsMap.values()).map((ing) => ({
                ingredient: {
                    id: ing.id,
                    name: ing.name,
                    price: ing.price.toString(),
                    isTopping: Boolean(ing.isTopping),
                    type: ing.type,
                    description: ing.description,
                    imageRoute: ing.imageRoute || undefined,
                },
            })),
        }

        const formattedSauces = sauces.map((s) => ({
            id: s.id,
            name: s.name,
            hex: s.hex || '#ffffff',
        }))

        return (
            <ProductClient
                initialProduct={formattedProduct}
                initialSauces={formattedSauces}
            />
        )
    } catch {
        notFound()
    }
}

