import { notFound } from 'next/navigation'
import { getActiveTableByNumber, getDrinks, getProducts } from '@/app/(public)/order/actions'
import ProductsClient from '../products/_components/productsClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ table: string }> }) {
    const { table: tableParam } = await params
    const number = Number(tableParam)
    const table = Number.isInteger(number) ? await getActiveTableByNumber(number) : null

    return {
        title: table ? `Mesa ${table.number} | CheesePapas` : 'Mesa no disponible | CheesePapas',
        description: table ? `Realiza tu pedido desde la mesa ${table.number}.` : 'Mesa no disponible.',
    }
}

export default async function TableOrderPage({ params }: { params: Promise<{ table: string }> }) {
    const { table: tableParam } = await params
    const number = Number(tableParam)
    if (!Number.isInteger(number)) notFound()

    const table = await getActiveTableByNumber(number)
    if (!table) notFound()

    const [products, drinks] = await Promise.all([getProducts(), getDrinks()])

    return (
        <ProductsClient
            table={{ id: table.id, number: table.number, name: table.name }}
            initialProducts={products.map((product) => ({
                id: product.id,
                name: product.name,
                description: product.description,
                imageRoute: product.imageRoute || undefined,
                price: product.price.toString(),
            }))}
            initialDrinks={drinks.map((drink) => ({
                id: drink.id,
                name: drink.name,
                description: drink.description,
                imageRoute: drink.imageRoute || undefined,
                price: drink.price.toString(),
            }))}
        />
    )
}