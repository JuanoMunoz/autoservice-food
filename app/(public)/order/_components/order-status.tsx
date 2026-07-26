'use client'

import { OrderStatus } from '@/types/Order'
import { AlertCircle, UtensilsCrossed, Truck, CheckCircle, XCircle } from 'lucide-react'

const STATUS_CONFIG = {
    CREATED: {
        icon: AlertCircle,
        label: 'Orden Recibida',
        description: 'Tu pedido ha sido registrado',
        color: 'bg-blue-50',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-200',
    },
    PREPARING: {
        icon: UtensilsCrossed,
        label: 'Preparando',
        description: 'Tu pedido está siendo preparado',
        color: 'bg-yellow-50',
        textColor: 'text-yellow-600',
        borderColor: 'border-yellow-200',
    },
    DELIVERING: {
        icon: Truck,
        label: 'En Camino',
        description: 'Tu pedido está en camino',
        color: 'bg-purple-50',
        textColor: 'text-purple-600',
        borderColor: 'border-purple-200',
    },
    COMPLETED: {
        icon: CheckCircle,
        label: 'Completada',
        description: 'Tu pedido ha sido entregado',
        color: 'bg-green-50',
        textColor: 'text-green-600',
        borderColor: 'border-green-200',
    },
    CANCELLED: {
        icon: XCircle,
        label: 'Cancelada',
        description: 'Tu pedido ha sido cancelado',
        color: 'bg-red-50',
        textColor: 'text-red-600',
        borderColor: 'border-red-200',
    },
}

interface OrderStatusBadgeProps {
    status: OrderStatus
    showDescription?: boolean
}

export function OrderStatusBadge({
    status,
    showDescription = true,
}: OrderStatusBadgeProps) {
    const config = STATUS_CONFIG[status]
    const Icon = config.icon

    return (
        <div className={`${config.color} border ${config.borderColor} rounded-none p-4`}>
            <div className="flex items-center gap-3">
                <Icon className={`w-8 h-8 ${config.textColor}`} />
                <div>
                    <p className={`font-bold ${config.textColor}`}>{config.label}</p>
                    {showDescription && <p className="text-sm text-gray-600">{config.description}</p>}
                </div>
            </div>
        </div>
    )
}

interface OrderTimelineProps {
    currentStatus: OrderStatus
}

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
    const statuses: OrderStatus[] = ['CREATED', 'PREPARING', 'DELIVERING', 'COMPLETED']
    const currentIndex = statuses.indexOf(currentStatus)

    return (
        <div className="space-y-3">
            {statuses.map((status, idx) => {
                const config = STATUS_CONFIG[status]
                const isCompleted = currentIndex >= idx
                const isCurrent = currentIndex === idx

                return (
                    <div key={status} className="flex items-center gap-3">
                        <div
                            className={`w-10 h-10 rounded-none flex items-center justify-center font-bold transition-all ${isCompleted
                                ? 'bg-secondary text-slate-950'
                                : 'bg-slate-200 text-slate-600'
                                } ${isCurrent ? 'ring-2 ring-secondary' : ''}`}
                        >
                            {idx + 1}
                        </div>
                        <div>
                            <p className={`font-semibold ${isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>
                                {config.label}
                            </p>
                            <p className="text-xs text-slate-500">{config.description}</p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
