import { getOrderDetail } from '@/app/(public)/order/actions'
import { notFound } from 'next/navigation'
import ConfirmationClient from './_components/confirmationClient'

export async function generateMetadata({ params }: { params: Promise<{ orderId: string }> }) {
    const { orderId } = await params
    return {
        title: `Pedido #${orderId} | CheesePapas`,
        description: 'Estado y detalles de tu pedido en CheesePapas.',
    }
}

export default async function ConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
    const { orderId } = await params
    const idNum = parseInt(orderId, 10)

    if (isNaN(idNum)) {
        notFound()
    }

    try {
        const order = await getOrderDetail(idNum)
        return <ConfirmationClient initialOrder={order} />
    } catch {
        notFound()
    }
}
