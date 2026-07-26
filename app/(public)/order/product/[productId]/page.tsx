import { getProductDetail, getSauces } from '@/app/(public)/order/actions'
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
        const [product, sauces] = await Promise.all([
            getProductDetail(productId),
            getSauces(),
        ])

        const formattedProduct = {
            id: product.id,
            name: product.name,
            description: product.description,
            imageRoute: product.imageRoute || undefined,
            price: product.price.toString(),
            productIngredients: product.productIngredients.map((pi) => ({
                ingredient: {
                    id: pi.ingredient.id,
                    name: pi.ingredient.name,
                    price: pi.ingredient.price.toString(),
                    isTopping: pi.ingredient.isTopping,
                    type: pi.ingredient.type,
                    description: pi.ingredient.description,
                    imageRoute: pi.ingredient.imageRoute || undefined,
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
