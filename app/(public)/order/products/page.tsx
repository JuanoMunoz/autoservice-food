import { getProducts, getDrinks } from '@/app/(public)/order/actions'
import ProductsClient from './_components/productsClient'

export const metadata = {
    title: 'Menú & Productos | CheesePapas ',
    description: 'Explora nuestro menú de comidas, papas especiales y bebidas heladas.',
}

export default async function ProductsPage() {
    const [products, drinks] = await Promise.all([
        getProducts(),
        getDrinks(),
    ])

    const formattedProducts = products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        imageRoute: p.imageRoute || undefined,
        price: p.price.toString(),
    }))

    const formattedDrinks = drinks.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        imageRoute: d.imageRoute || undefined,
        price: d.price.toString(),
    }))

    return (
        <ProductsClient
            initialProducts={formattedProducts}
            initialDrinks={formattedDrinks}
        />

    )
}


