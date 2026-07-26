import { requireSession } from "@/utils/auth"
import { Sparkles, Utensils, CupSoda, Sandwich, Settings, ShoppingCart } from "lucide-react"
import Link from "next/link"
import DashboardPageClient from "./_components/DashboardPageClient"
import { getAllActiveOrders } from "@/app/(public)/order/actions"

export const metadata = {
    title: 'Pantalla de Cocina (KDS) | CheesePapas Admin',
    description: 'Sistema de Gestión de Pedidos y Cocina en Tiempo Real.',
}

export default async function DashboardPage() {
    const session = await requireSession()
    const initialOrders = await getAllActiveOrders()

    return (
        <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">

            <DashboardPageClient initialOrders={initialOrders} />
        </div>
    )
}