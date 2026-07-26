import CheckoutClient from './_components/checkoutClient'
import { getDeliveryFee } from '../actions'

export const metadata = {
    title: 'Confirmar Pedido | CheesePapas',
    description: 'Revisa tu resumen de compra y confirma tu pedido en CheesePapas.',
}

export default async function CheckoutPage() {
    const initialDeliveryFee = await getDeliveryFee()
    return <CheckoutClient initialDeliveryFee={initialDeliveryFee} />
}
