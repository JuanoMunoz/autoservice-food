import { getDrinkDetail } from '@/app/(public)/order/actions'
import { notFound } from 'next/navigation'
import DrinkClient from './_components/drinkClient'

export async function generateMetadata({ params }: { params: Promise<{ drinkId: string }> }) {
    const { drinkId } = await params
    try {
        const drink = await getDrinkDetail(drinkId)
        return {
            title: `${drink.name} | CheesePapas`,
            description: drink.description,
        }
    } catch {
        return {
            title: 'Bebida | CheesePapas',
        }
    }
}

export default async function DrinkDetailPage({ params }: { params: Promise<{ drinkId: string }> }) {
    const { drinkId } = await params

    try {
        const drink = await getDrinkDetail(drinkId)

        const formattedDrink = {
            id: drink.id,
            name: drink.name,
            description: drink.description,
            imageRoute: drink.imageRoute || undefined,
            price: drink.price.toString(),
        }

        return <DrinkClient initialDrink={formattedDrink} />
    } catch {
        notFound()
    }
}
