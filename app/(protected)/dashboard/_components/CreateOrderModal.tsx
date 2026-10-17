'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Search, Plus, Minus, Trash2, X, ShoppingBag, UserRound, MapPin, Truck, RefreshCw, StickyNote, ChevronDown, Check, Loader2 } from 'lucide-react'
import { createAdminOrder, findLatestCustomerByPhone } from '../actions'
import { calculateDeliveryFee } from '@/app/(public)/order/actions'
import LocationPickerModal from '@/app/(public)/order/checkout/_components/LocationPickerModal'
import type { AdminCustomerContact, AdminOrderCatalog } from '@/types/AdminOrder'
import type { CartItem, OrderResponse, DeliveryFeeCalculationResult } from '@/types/Order'
import { formatCurrency } from '@/utils/cartStorage'

interface CreateOrderModalProps {
    catalog: AdminOrderCatalog
    onClose: () => void
    onCreated: (order: OrderResponse) => void
}

type FilterChip = 'all' | 'product' | 'drink'

interface DraftLine {
    id: string
    catalogId: string
    kind: 'product' | 'drink'
    label: string
    price: number
    quantity: number
    extrasLabel?: string
    note?: string
    item: CartItem
}

interface CatalogCard {
    kind: 'product' | 'drink'
    id: string
    name: string
    price: number
    hasOptions: boolean
}

const emptyContact: AdminCustomerContact = {
    name: '',
    phone: '',
    email: '',
    address: '',
    reference: '',
    onSite: true,
}

const MAX_NOTES = 300
const MAX_ITEM_NOTE = 140

export default function CreateOrderModal({ catalog, onClose, onCreated }: CreateOrderModalProps) {
    const [contact, setContact] = useState<AdminCustomerContact>(emptyContact)
    const [filter, setFilter] = useState<FilterChip>('all')
    const [search, setSearch] = useState('')
    const [lines, setLines] = useState<DraftLine[]>([])
    const [notes, setNotes] = useState('')
    const [detailsOpen, setDetailsOpen] = useState(false)

    // Bottom sheet for products with options
    const [sheetId, setSheetId] = useState<string | null>(null)
    const [sheetIngredients, setSheetIngredients] = useState<string[]>([])
    const [sheetSauces, setSheetSauces] = useState<string[]>([])

    // Delivery fee state & map modal
    const [deliveryFee, setDeliveryFee] = useState<number>(0)
    const [isFeeManual, setIsFeeManual] = useState(false)
    const [feeInfo, setFeeInfo] = useState<DeliveryFeeCalculationResult | null>(null)
    const [isCalculatingFee, setIsCalculatingFee] = useState(false)
    const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>(undefined)
    const [isMapOpen, setIsMapOpen] = useState(false)
    const [paymentType, setPaymentType] = useState<'cash' | 'transfer'>('cash')
    const [pagaCon, setPagaCon] = useState('')
    const [serveAtTable, setServeAtTable] = useState(true)

    // Customer autocomplete
    const [isAutocompleting, startAutocomplete] = useTransition()
    const [customerFound, setCustomerFound] = useState(false)
    const lastSearchedPhone = useRef('')

    const [isSaving, startSaving] = useTransition()
    const [confirmClose, setConfirmClose] = useState(false)
    const [lastRemoved, setLastRemoved] = useState<{ line: DraftLine; index: number } | null>(null)
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
    const [noteDraft, setNoteDraft] = useState('')

    // Dynamic Delivery Fee Calculation effect (pauses while manually overridden)
    useEffect(() => {
        if (isFeeManual) return
        async function updateDeliveryFee() {
            if (contact.onSite) return
            setIsCalculatingFee(true)
            try {
                const res = await calculateDeliveryFee(coords)
                setFeeInfo(res)
                setDeliveryFee(res.fee)
            } catch (err) {
                console.error('Error calculating delivery fee:', err)
            } finally {
                setIsCalculatingFee(false)
            }
        }
        updateDeliveryFee()
    }, [contact.onSite, coords?.lat, coords?.lng, isFeeManual])

    // Autocomplete on phone: debounce ~350ms when reaching 10 digits
    const phoneDigits = contact.phone.replace(/\D/g, '')
    useEffect(() => {
        if (phoneDigits.length < 10) return
        if (lastSearchedPhone.current === phoneDigits) return
        const t = setTimeout(() => {
            lastSearchedPhone.current = phoneDigits
            startAutocomplete(async () => {
                try {
                    const customer = await findLatestCustomerByPhone(contact.phone)
                    if (!customer) return
                    setContact((c) => ({
                        ...c,
                        name: customer.buyerName || c.name,
                        phone: customer.buyerPhone || c.phone,
                        email: (customer.buyerEmail as string) || c.email,
                        address: (customer.address as string) || c.address,
                        reference: ((customer as unknown as { addressReference?: string }).addressReference as string) || c.reference || '',
                        onSite: (customer.onSite as boolean) ?? c.onSite,
                    }))
                    setCustomerFound(true)
                } catch { /* silencioso en hora pico */ }
            })
        }, 350)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phoneDigits])

    const updateContact = (field: keyof AdminCustomerContact, value: string | boolean) => {
        setContact((current) => ({ ...current, [field]: value }))
        if (field === 'phone') setCustomerFound(false)
    }

    // Unified catalog for chips + search
    const cards: CatalogCard[] = useMemo(() => {
        const products: CatalogCard[] = catalog.products.map((p) => {
            const toppings = p.productIngredients.filter((pi) => pi.ingredient.isTopping).length
            return {
                kind: 'product' as const,
                id: p.id,
                name: p.name,
                price: p.price,
                hasOptions: toppings > 0 || catalog.sauces.length > 0,
            }
        })
        const drinks: CatalogCard[] = catalog.drinks.map((d) => ({
            kind: 'drink' as const,
            id: d.id,
            name: d.name,
            price: d.price,
            hasOptions: false,
        }))
        return [...products, ...drinks]
    }, [catalog])

    const filteredCards = useMemo(() => {
        const q = search.trim().toLowerCase()
        return cards.filter((c) => {
            if (filter !== 'all' && c.kind !== filter) return false
            if (q && !c.name.toLowerCase().includes(q)) return false
            return true
        })
    }, [cards, filter, search])

    const qtyByCatalog = useMemo(() => {
        const map = new Map<string, number>()
        for (const l of lines) map.set(l.catalogId, (map.get(l.catalogId) ?? 0) + l.quantity)
        return map
    }, [lines])

    const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
    const activeDeliveryFee = contact.onSite ? 0 : deliveryFee
    const finalTotal = subtotal + activeDeliveryFee

    const pagaConNum = Number(pagaCon.replace(/[^0-9]/g, '')) || 0
    const cambio = pagaConNum > 0 ? pagaConNum - finalTotal : null

    // Validation with explicit missing text (not color alone)
    const missing: string[] = []
    if (lines.length === 0) missing.push('agrega 1 producto')
    if (!contact.name.trim()) missing.push('falta nombre')
    if (phoneDigits.length < 10) missing.push('falta celular (10 dígitos)')
    if (!contact.onSite && !contact.address.trim()) missing.push('falta dirección')
    const canSubmit = missing.length === 0 && !isSaving

    // ---- Line helpers ----
    const buildSimpleItem = (card: CatalogCard): CartItem => {
        if (card.kind === 'drink') {
            const d = catalog.drinks.find((x) => x.id === card.id)!
            return { type: 'drink', id: d.id, drinkId: d.id, name: d.name, description: d.description, price: d.price, quantity: 1 }
        }
        const p = catalog.products.find((x) => x.id === card.id)!
        return {
            type: 'product', id: p.id, productId: p.id, name: p.name, description: p.description,
            price: p.price, quantity: 1, ingredients: [], sauces: [],
        }
    }

    const addOrIncrementSimple = (card: CatalogCard) => {
        setLastRemoved(null)
        setLines((current) => {
            const idx = current.findIndex((l) => l.catalogId === card.id && !l.extrasLabel)
            if (idx >= 0) {
                const copy = [...current]
                copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1, item: { ...copy[idx].item, quantity: copy[idx].quantity + 1 } as CartItem }
                return copy
            }
            const item = buildSimpleItem(card)
            return [...current, { id: crypto.randomUUID(), catalogId: card.id, kind: card.kind, label: card.name, price: card.price, quantity: 1, item }]
        })
    }

    const incrementCatalog = (catalogId: string) => {
        setLastRemoved(null)
        setLines((current) => {
            // incrementa la última línea de ese producto (misma config)
            let target = -1
            for (let i = current.length - 1; i >= 0; i--) {
                if (current[i].catalogId === catalogId) { target = i; break }
            }
            if (target < 0) return current
            const copy = [...current]
            copy[target] = { ...copy[target], quantity: copy[target].quantity + 1, item: { ...copy[target].item, quantity: copy[target].quantity + 1 } as CartItem }
            return copy
        })
    }

    const decrementCatalog = (catalogId: string) => {
        setLines((current) => {
            let target = -1
            for (let i = current.length - 1; i >= 0; i--) {
                if (current[i].catalogId === catalogId) { target = i; break }
            }
            if (target < 0) return current
            const line = current[target]
            if (line.quantity > 1) {
                const copy = [...current]
                copy[target] = { ...copy[target], quantity: line.quantity - 1, item: { ...line.item, quantity: line.quantity - 1 } as CartItem }
                return copy
            }
            // qty 1 -> quitar con opción deshacer
            setLastRemoved({ line, index: target })
            return current.filter((_, i) => i !== target)
        })
    }

    const handleCardTap = (card: CatalogCard) => {
        if (!card.hasOptions) {
            addOrIncrementSimple(card)
            return
        }
        const existing = qtyByCatalog.get(card.id) ?? 0
        if (existing > 0) {
            // taps siguientes solo suman (misma config que la última)
            incrementCatalog(card.id)
            return
        }
        // primer toque abre bottom sheet para configurar
        setSheetIngredients([])
        setSheetSauces([])
        setSheetId(card.id)
    }

    const incrementLine = (id: string) => {
        setLastRemoved(null)
        setLines((current) => current.map((l) => l.id === id ? { ...l, quantity: l.quantity + 1, item: { ...l.item, quantity: l.quantity + 1 } as CartItem } : l))
    }

    const decrementLine = (id: string) => {
        setLines((current) => {
            const idx = current.findIndex((l) => l.id === id)
            if (idx < 0) return current
            const line = current[idx]
            if (line.quantity > 1) {
                const copy = [...current]
                copy[idx] = { ...line, quantity: line.quantity - 1, item: { ...line.item, quantity: line.quantity - 1 } as CartItem }
                return copy
            }
            setLastRemoved({ line, index: idx })
            return current.filter((l) => l.id !== id)
        })
    }

    const removeLine = (id: string) => {
        setLines((current) => {
            const idx = current.findIndex((l) => l.id === id)
            if (idx < 0) return current
            setLastRemoved({ line: current[idx], index: idx })
            return current.filter((l) => l.id !== id)
        })
    }

    const undoRemove = () => {
        if (!lastRemoved) return
        const { line, index } = lastRemoved
        setLines((current) => {
            const copy = [...current]
            copy.splice(Math.min(index, copy.length), 0, line)
            return copy
        })
        setLastRemoved(null)
    }

    useEffect(() => {
        if (!lastRemoved) return
        const t = setTimeout(() => setLastRemoved(null), 6000)
        return () => clearTimeout(t)
    }, [lastRemoved])

    // Bottom sheet confirm
    const sheetCard = sheetId ? cards.find((c) => c.id === sheetId) ?? null : null
    const sheetProduct = sheetCard?.kind === 'product' ? catalog.products.find((p) => p.id === sheetCard.id) : null
    const sheetToppings = sheetProduct?.productIngredients.map(({ ingredient }) => ingredient).filter((i) => i.isTopping) ?? []
    const sheetExtrasTotal = sheetProduct?.productIngredients
        .filter(({ ingredient }) => sheetIngredients.includes(ingredient.id))
        .reduce((sum, { ingredient }) => sum + ingredient.price, 0) ?? 0
    const sheetUnitPrice = (sheetProduct?.price ?? sheetCard?.price ?? 0) + sheetExtrasTotal
    const allSaucesSelected = catalog.sauces.length > 0 && sheetSauces.length === catalog.sauces.length
    const toggleAllSauces = () => {
        setSheetSauces((current) => current.length === catalog.sauces.length ? [] : catalog.sauces.map((s) => s.id))
    }

    const confirmSheet = () => {
        if (!sheetCard || !sheetProduct) return
        const sauces = catalog.sauces.filter((s) => sheetSauces.includes(s.id))
        const extrasLabelParts: string[] = []
        const ingredientNames = sheetProduct.productIngredients
            .filter(({ ingredient }) => sheetIngredients.includes(ingredient.id))
            .map(({ ingredient }) => ingredient.name)
        if (ingredientNames.length) extrasLabelParts.push(`+ ${ingredientNames.join(', ')}`)
        if (sauces.length) extrasLabelParts.push(`Salsas: ${sauces.map((s) => s.name).join(', ')}`)
        const item: CartItem = {
            type: 'product', id: sheetProduct.id, productId: sheetProduct.id,
            name: sheetProduct.name, description: sheetProduct.description,
            price: sheetProduct.price, quantity: 1,
            ingredients: sheetProduct.productIngredients
                .filter(({ ingredient }) => sheetIngredients.includes(ingredient.id))
                .map(({ ingredient }) => ({ id: ingredient.id, name: ingredient.name, price: ingredient.price, quantity: 1 })),
            sauces,
        }
        setLines((current) => [...current, {
            id: crypto.randomUUID(), catalogId: sheetProduct.id, kind: 'product',
            label: sheetProduct.name, price: sheetUnitPrice, quantity: 1,
            extrasLabel: extrasLabelParts.join(' · ') || undefined, item,
        }])
        setSheetId(null)
        setSheetIngredients([])
        setSheetSauces([])
    }

    const handleLocationSelected = async (data: { street: string; reference: string; lat?: number; lng?: number }) => {
        if (data.street) updateContact('address', data.street)
        if (data.reference) updateContact('reference', data.reference)
        if (data.lat && data.lng) {
            const newCoords = { lat: data.lat, lng: data.lng }
            setCoords(newCoords)
            if (isFeeManual) return
            setIsCalculatingFee(true)
            try {
                const res = await calculateDeliveryFee(newCoords)
                setFeeInfo(res)
                setDeliveryFee(res.fee)
            } catch (err) {
                console.error('Error calculating dynamic fee:', err)
            } finally {
                setIsCalculatingFee(false)
            }
        }
    }

    const handleManualFeeChange = (raw: string) => {
        const parsed = Number(raw.replace(/[^0-9]/g, ''))
        if (!Number.isFinite(parsed)) return
        setDeliveryFee(Math.max(0, Math.min(100000, Math.round(parsed))))
        setIsFeeManual(true)
    }

    const handleRecalculateFee = async () => {
        setIsFeeManual(false)
        setIsCalculatingFee(true)
        try {
            const res = await calculateDeliveryFee(coords)
            setFeeInfo(res)
            setDeliveryFee(res.fee)
        } catch (err) {
            console.error('Error recalculating delivery fee:', err)
            toast.error('No se pudo recalcular el domicilio')
            setIsFeeManual(true)
        } finally {
            setIsCalculatingFee(false)
        }
    }

    const requestClose = () => {
        if (lines.length > 0 && !confirmClose) {
            setConfirmClose(true)
            return
        }
        onClose()
    }

    const saveNoteForLine = (id: string) => {
        const trimmed = noteDraft.slice(0, MAX_ITEM_NOTE).trim()
        setLines((current) => current.map((l) => l.id === id
            ? { ...l, note: trimmed || undefined, item: { ...l.item, note: trimmed || undefined } as CartItem }
            : l))
        setEditingNoteId(null)
        setNoteDraft('')
    }

    const handleCreate = () => {
        if (!contact.phone.trim() || !contact.name.trim()) {
            toast.error('El celular y el nombre son obligatorios')
            return
        }
        if (phoneDigits.length < 10) {
            toast.error('El celular debe tener 10 dígitos')
            return
        }
        if (!contact.onSite && !contact.address.trim()) {
            toast.error('Escribe la dirección de entrega')
            return
        }
        if (lines.length === 0) {
            toast.error('Agrega al menos un producto al pedido')
            return
        }

        startSaving(async () => {
            try {
                const order = await createAdminOrder({
                    location: contact.onSite ? 'onSite' : 'delivery',
                    items: lines.map((line) => line.item),
                    buyerName: contact.name.trim(),
                    buyerPhone: contact.phone.trim(),
                    buyerEmail: contact.email.trim() || undefined,
                    deliveryAddress: contact.onSite ? undefined : {
                        street: contact.address.trim(),
                        reference: (contact.reference || '').trim(),
                        coordinates: coords,
                    },
                    paymentType,
                    total: finalTotal,
                    notes: notes.trim() || undefined,
                    serveAtTable: contact.onSite ? serveAtTable : undefined,
                }, contact.onSite ? undefined : { manualDeliveryFee: deliveryFee })
                toast.success(`Orden #${order.id} creada correctamente`)
                onCreated(order)
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'No se pudo crear la orden')
            }
        })
    }

    const chipCls = (active: boolean) =>
        `min-h-12 shrink-0 rounded-full border px-5 text-sm font-black transition-all cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-amber-400 ${active
            ? 'border-amber-400 bg-amber-500 text-slate-950 shadow-md'
            : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'}`

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/85 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={requestClose}
            role="dialog"
            aria-modal="true"
            aria-label="Añadir orden"
        >
            <div
                className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-3xl border border-slate-700 bg-slate-900 shadow-2xl sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-4 py-3 sm:px-5 sm:py-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-amber-500/15 p-2.5 text-amber-300"><ShoppingBag className="h-5 w-5" /></div>
                        <div>
                            <h2 className="text-lg font-black text-white">Añadir orden</h2>
                            <p className="text-xs font-medium text-slate-400">Toca una tarjeta para agregar · {lines.reduce((n, l) => n + l.quantity, 0)} uds</p>
                        </div>
                    </div>
                    <button type="button" onClick={requestClose} className="flex min-h-12 min-w-12 items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-amber-400" aria-label="Cerrar modal"><X className="h-6 w-6" /></button>
                </div>

                {confirmClose && (
                    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-3" role="alert">
                        <p className="text-sm font-bold text-amber-200">¿Cerrar? Tienes {lines.length} ítem(s) cargados y se perderán.</p>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setConfirmClose(false)} className="min-h-12 rounded-xl border border-slate-600 px-4 text-sm font-bold text-slate-200 cursor-pointer">Seguir</button>
                            <button type="button" onClick={onClose} className="min-h-12 rounded-xl bg-rose-600 px-4 text-sm font-black text-white cursor-pointer">Cerrar</button>
                        </div>
                    </div>
                )}

                {/* Main: catalog left, summary right (landscape) / stacked (portrait) */}
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
                    {/* Catalog */}
                    <section className={`${detailsOpen ? 'hidden md:flex' : 'flex'} min-h-0 flex-1 flex-col overflow-hidden`} aria-label="Catálogo">
                        <div className="shrink-0 space-y-3 border-b border-slate-800 p-4">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                <label htmlFor="catalog-search" className="sr-only">Buscar producto o bebida</label>
                                <input
                                    id="catalog-search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar producto o bebida…"
                                    type="search"
                                    autoComplete="off"
                                    className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-base text-white outline-none placeholder:text-slate-500 focus:border-amber-400"
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Filtrar por categoría">
                                <button type="button" role="radio" aria-checked={filter === 'all'} onClick={() => setFilter('all')} className={chipCls(filter === 'all')}>Todos</button>
                                <button type="button" role="radio" aria-checked={filter === 'product'} onClick={() => setFilter('product')} className={chipCls(filter === 'product')}>Productos</button>
                                <button type="button" role="radio" aria-checked={filter === 'drink'} onClick={() => setFilter('drink')} className={chipCls(filter === 'drink')}>Bebidas</button>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-4">
                            {filteredCards.length === 0 ? (
                                <p className="py-10 text-center text-base text-slate-500">Sin resultados para “{search}”</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                                    {filteredCards.map((card) => {
                                        const qty = qtyByCatalog.get(card.id) ?? 0
                                        const added = qty > 0
                                        return (
                                            <div
                                                key={`${card.kind}-${card.id}`}
                                                className={`flex min-h-[152px] flex-col justify-between rounded-2xl border p-3.5 transition-all active:scale-[0.98] ${added ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_0_1px_var(--color-amber-500)]' : 'border-slate-700 bg-slate-950/70 hover:border-slate-600'}`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => handleCardTap(card)}
                                                    aria-label={added ? `${card.name}, ${qty} en pedido, tocar para agregar otra` : `Agregar ${card.name} al pedido`}
                                                    className="flex flex-1 flex-col items-start gap-1 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-amber-400"
                                                >
                                                    <span className="flex w-full items-center justify-between gap-2">
                                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{card.kind === 'product' ? 'Producto' : 'Bebida'}</span>
                                                        {added && <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-black text-slate-950"><Check className="h-3 w-3" /> {qty}</span>}
                                                    </span>
                                                    <span className="line-clamp-3 text-2xl font-black leading-tight text-white">{card.name}</span>
                                                    <span className="text-xl font-black text-amber-300">{formatCurrency(card.price)}</span>
                                                    {card.hasOptions && !added && <span className="text-xs font-bold text-slate-400">Toca para personalizar</span>}
                                                </button>
                                                {added ? (
                                                    <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-900 p-1" role="group" aria-label={`Cantidad de ${card.name}`}>
                                                        <button type="button" onClick={() => decrementCatalog(card.id)} aria-label={`Quitar uno de ${card.name}`} className="flex min-h-12 min-w-12 items-center justify-center rounded-lg bg-slate-800 text-white active:bg-slate-700 cursor-pointer"><Minus className="h-5 w-5" /></button>
                                                        <span className="min-w-8 text-center text-xl font-black text-white" aria-live="polite">{qty}</span>
                                                        <button type="button" onClick={() => incrementCatalog(card.id)} aria-label={`Agregar otro de ${card.name}`} className="flex min-h-12 min-w-12 items-center justify-center rounded-lg bg-amber-500 text-slate-950 active:bg-amber-400 cursor-pointer"><Plus className="h-5 w-5" /></button>
                                                    </div>
                                                ) : (
                                                    <div className="mt-2 flex items-center justify-center gap-1 rounded-xl bg-slate-800/60 py-1 text-xs font-bold text-slate-400">
                                                        <Plus className="h-4 w-4" /> Toca para agregar
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Summary */}
                    <section className={`flex w-full flex-col border-t border-slate-800 bg-slate-950/60 md:min-h-0 md:w-[400px] md:flex-none md:overflow-visible md:border-l md:border-t-0 lg:w-[430px] ${detailsOpen ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain' : 'shrink-0'}`} aria-label="Resumen del pedido">
                        <div className="flex shrink-0 items-center justify-between px-4 pt-3">
                            <h3 className="text-base font-black text-white">Resumen</h3>
                            <span className="text-xs font-bold text-slate-500">{lines.length} ítem(s) · {lines.reduce((n, l) => n + l.quantity, 0)} uds</span>
                        </div>

                        <div className={`space-y-2 p-4 md:min-h-0 md:max-h-none md:flex-1 md:overflow-y-auto ${detailsOpen ? '' : 'max-h-[28vh] min-h-0 flex-1 overflow-y-auto'}`}>
                            {lines.length === 0 ? (
                                <p className="py-8 text-center text-base text-slate-500">Toca una tarjeta para comenzar.<br />1 toque = 1 unidad.</p>
                            ) : lines.map((line) => (
                                <div key={line.id} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-lg font-black text-white">{line.quantity}x {line.label}</p>
                                            <p className="text-sm text-slate-400">{formatCurrency(line.price)} c/u{line.extrasLabel ? ` · ${line.extrasLabel}` : ''}</p>
                                            {line.note && <p className="mt-1 break-words rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-200">📝 {line.note}</p>}
                                        </div>
                                        <span className="shrink-0 text-base font-black text-amber-300">{formatCurrency(line.price * line.quantity)}</span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-1" role="group" aria-label={`Cantidad de ${line.label}`}>
                                            <button type="button" onClick={() => decrementLine(line.id)} aria-label="Disminuir cantidad" className="flex min-h-12 min-w-12 items-center justify-center rounded-md bg-slate-800 text-white active:bg-slate-700 cursor-pointer"><Minus className="h-5 w-5" /></button>
                                            <span className="w-8 text-center text-lg font-black text-white" aria-live="polite">{line.quantity}</span>
                                            <button type="button" onClick={() => incrementLine(line.id)} aria-label="Aumentar cantidad" className="flex min-h-12 min-w-12 items-center justify-center rounded-md bg-slate-800 text-white active:bg-slate-700 cursor-pointer"><Plus className="h-5 w-5" /></button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (editingNoteId === line.id) { setEditingNoteId(null); return }
                                                setEditingNoteId(line.id)
                                                setNoteDraft(line.note ?? '')
                                            }}
                                            aria-label={line.note ? 'Editar nota del ítem' : 'Agregar nota al ítem'}
                                            aria-pressed={editingNoteId === line.id}
                                            title="Nota del ítem (opcional)"
                                            className={`flex min-h-12 min-w-12 items-center justify-center rounded-lg border cursor-pointer ${line.note ? 'border-amber-400/60 bg-amber-500/10 text-amber-300' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                                        >
                                            <StickyNote className="h-5 w-5" />
                                        </button>
                                        <button type="button" onClick={() => removeLine(line.id)} className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-950 hover:text-rose-400 cursor-pointer" aria-label={`Eliminar ${line.label}`}><Trash2 className="h-5 w-5" /></button>
                                    </div>
                                    {editingNoteId === line.id && (
                                        <div className="mt-2 flex gap-2">
                                            <label htmlFor={`note-${line.id}`} className="sr-only">Nota para {line.label}</label>
                                            <input
                                                id={`note-${line.id}`}
                                                value={noteDraft}
                                                onChange={(e) => setNoteDraft(e.target.value.slice(0, MAX_ITEM_NOTE))}
                                                placeholder="Ej: sin cebolla (máx 140)"
                                                maxLength={MAX_ITEM_NOTE}
                                                className="min-h-12 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-base text-white outline-none focus:border-amber-400"
                                            />
                                            <button type="button" onClick={() => saveNoteForLine(line.id)} className="min-h-12 rounded-lg bg-amber-500 px-4 text-sm font-black text-slate-950 cursor-pointer">OK</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {lastRemoved && (
                                <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2" role="status">
                                    <span className="text-sm text-slate-300">Ítem eliminado</span>
                                    <button type="button" onClick={undoRemove} className="min-h-12 rounded-lg px-3 text-sm font-black text-amber-300 cursor-pointer">Deshacer</button>
                                </div>
                            )}
                        </div>

                        {/* Sticky totals */}
                        <div className="shrink-0 space-y-3 border-t border-slate-800 bg-slate-950 p-4">
                            <div>
                                <label htmlFor="order-notes" className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-400">
                                    <span>Observaciones (opcional)</span>
                                    <span className="text-slate-500">{notes.length}/{MAX_NOTES}</span>
                                </label>
                                <textarea
                                    id="order-notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES))}
                                    placeholder="Ej: sin cebolla, salsa aparte, timbre dañado"
                                    rows={2}
                                    maxLength={MAX_NOTES}
                                    className="max-h-24 min-h-12 w-full resize-y rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-base text-white outline-none placeholder:text-slate-500 focus:border-amber-400"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setDetailsOpen((v) => !v)}
                                aria-expanded={detailsOpen}
                                className="flex min-h-12 w-full items-center justify-between rounded-xl border border-slate-700 px-3 text-sm font-black text-slate-200 cursor-pointer hover:bg-slate-900"
                            >
                                <span className="flex items-center gap-2"><UserRound className="h-4 w-4 text-amber-300" /> Datos del cliente {customerFound && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-black text-emerald-300">Cliente encontrado</span>}</span>
                                <ChevronDown className={`h-5 w-5 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {detailsOpen && (
                                <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                                    <div>
                                        <label htmlFor="cust-phone" className="mb-1 block text-xs font-bold text-slate-400">Celular * {isAutocompleting && <span className="text-slate-500">(buscando…)</span>}</label>
                                        <input id="cust-phone" value={contact.phone} onChange={(e) => updateContact('phone', e.target.value)} placeholder="Número de celular (10 dígitos)" type="tel" inputMode="tel" autoComplete="tel" className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-base text-white outline-none focus:border-amber-400" />
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                                        <div>
                                            <label htmlFor="cust-name" className="mb-1 block text-xs font-bold text-slate-400">Nombre *</label>
                                            <input id="cust-name" value={contact.name} onChange={(e) => updateContact('name', e.target.value)} placeholder="Nombre completo" type="text" autoComplete="name" className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-base text-white outline-none focus:border-amber-400" />
                                        </div>
                                        <div>
                                            <label htmlFor="cust-email" className="mb-1 block text-xs font-bold text-slate-400">Correo (opcional)</label>
                                            <input id="cust-email" value={contact.email} onChange={(e) => updateContact('email', e.target.value)} placeholder="Correo" type="email" inputMode="email" autoComplete="email" className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-base text-white outline-none focus:border-amber-400" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de entrega">
                                        <button type="button" role="radio" aria-checked={contact.onSite} onClick={() => updateContact('onSite', true)} className={`min-h-12 rounded-xl border px-3 text-sm font-black cursor-pointer transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-amber-400 ${contact.onSite ? 'border-amber-400 bg-amber-500 text-slate-950 shadow-md' : 'border-slate-700 text-slate-400 hover:bg-slate-900'}`}>En el local</button>
                                        <button type="button" role="radio" aria-checked={!contact.onSite} onClick={() => updateContact('onSite', false)} className={`min-h-12 rounded-xl border px-3 text-sm font-black cursor-pointer transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-amber-400 ${!contact.onSite ? 'border-amber-400 bg-amber-500 text-slate-950 shadow-md' : 'border-slate-700 text-slate-400 hover:bg-slate-900'}`}>A domicilio</button>
                                    </div>

                                    {/* Llevar a mesa (solo consumo local, marcado por defecto) */}
                                    <div className={`grid transition-all duration-200 ${contact.onSite ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-700 px-3 py-2 text-base font-bold text-slate-200 active:bg-slate-800">
                                                <input
                                                    type="checkbox"
                                                    checked={serveAtTable}
                                                    onChange={(e) => setServeAtTable(e.target.checked)}
                                                    className="h-5 w-5 shrink-0 accent-amber-500"
                                                />
                                                Llevar a mesa
                                            </label>
                                        </div>
                                    </div>

                                    {/* Reserva de espacio para domicilio: evita saltos bruscos */}
                                    <div className={`grid transition-all duration-200 ${contact.onSite ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}>
                                        <div className="overflow-hidden">
                                            <div className="space-y-2 pt-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-300"><Truck className="h-4 w-4 text-amber-400" /> Dirección de entrega</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <label htmlFor="fee-input" className="text-[11px] font-bold text-slate-400">Domicilio $</label>
                                                        <input id="fee-input" type="number" min={0} max={100000} step={500} value={deliveryFee} disabled={isCalculatingFee} onChange={(e) => handleManualFeeChange(e.target.value)} className="min-h-12 w-24 rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm font-black text-amber-300 outline-none focus:border-amber-400 disabled:opacity-50" aria-label="Valor del domicilio" />
                                                        {isFeeManual ? (
                                                            <button type="button" onClick={handleRecalculateFee} disabled={isCalculatingFee} className="flex min-h-12 items-center gap-1 rounded-lg border border-slate-700 px-2 text-[11px] font-black text-slate-300 hover:bg-slate-800 disabled:opacity-50 cursor-pointer" title="Volver al cálculo automático"><RefreshCw className="h-3.5 w-3.5" /> Auto</button>
                                                        ) : (
                                                            <span className="text-[11px] font-bold text-slate-500">{isCalculatingFee ? 'Calculando…' : 'Auto'}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => setIsMapOpen(true)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 text-xs font-black text-amber-300 hover:bg-amber-500/20 cursor-pointer">
                                                    <MapPin className="h-4 w-4 text-amber-400" /><span>Ubicación en mapa (GPS)</span>
                                                </button>
                                                {feeInfo && feeInfo.distanceKm > 0 && (
                                                    <div className="flex justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-[11px] font-medium text-slate-400">
                                                        <span className="font-bold text-slate-300">Distancia: {feeInfo.distanceKm} km</span>
                                                        <span className="text-amber-300">{feeInfo.isBaseKm ? 'Tarifa base' : `${feeInfo.extraKm} km adicionales`}</span>
                                                    </div>
                                                )}
                                                <div>
                                                    <label htmlFor="cust-address" className="sr-only">Dirección completa</label>
                                                    <input id="cust-address" value={contact.address} onChange={(e) => updateContact('address', e.target.value)} placeholder="Dirección completa (Ej: Calle 45 #23-12)" autoComplete="street-address" className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-base text-white outline-none focus:border-amber-400" />
                                                </div>
                                                <div>
                                                    <label htmlFor="cust-ref" className="sr-only">Barrio o referencia</label>
                                                    <input id="cust-ref" value={contact.reference || ''} onChange={(e) => updateContact('reference', e.target.value)} placeholder="Barrio / referencia (Ej: Apt 301)" className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-base text-white outline-none focus:border-amber-400" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <p id="pay-label" className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Método de pago</p>
                                        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="pay-label">
                                            <button type="button" role="radio" aria-checked={paymentType === 'cash'} onClick={() => setPaymentType('cash')} className={`min-h-12 rounded-xl border px-3 text-sm font-black cursor-pointer transition-all active:scale-[0.98] ${paymentType === 'cash' ? 'border-amber-400 bg-amber-500 text-slate-950 shadow-md' : 'border-slate-700 text-slate-400 hover:bg-slate-900'}`}>Efectivo</button>
                                            <button type="button" role="radio" aria-checked={paymentType === 'transfer'} onClick={() => setPaymentType('transfer')} className={`min-h-12 rounded-xl border px-3 text-sm font-black cursor-pointer transition-all active:scale-[0.98] ${paymentType === 'transfer' ? 'border-amber-400 bg-amber-500 text-slate-950 shadow-md' : 'border-slate-700 text-slate-400 hover:bg-slate-900'}`}>Transferencia</button>
                                        </div>
                                        {paymentType === 'cash' && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="flex-1">
                                                    <label htmlFor="paga-con" className="mb-1 block text-xs font-bold text-slate-400">Paga con (opcional)</label>
                                                    <input id="paga-con" value={pagaCon} onChange={(e) => setPagaCon(e.target.value.replace(/[^0-9]/g, '').slice(0, 7))} placeholder="Ej: 50000" type="text" inputMode="numeric" className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-base text-white outline-none focus:border-amber-400" />
                                                </div>
                                                <div className="flex-1 rounded-xl bg-slate-950 p-2 text-center" aria-live="polite">
                                                    <p className="text-[11px] font-bold uppercase text-slate-500">Cambio</p>
                                                    <p className={`text-lg font-black ${cambio !== null && cambio >= 0 ? 'text-emerald-300' : 'text-slate-400'}`}>
                                                        {cambio === null ? '—' : cambio >= 0 ? formatCurrency(cambio) : `Faltan ${formatCurrency(-cambio)}`}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5 pt-1 text-sm font-bold text-slate-400">
                                <div className="flex items-center justify-between"><span>Subtotal</span><span className="text-slate-200">{formatCurrency(subtotal)}</span></div>
                                {!contact.onSite && (
                                    <div className="flex items-center justify-between text-amber-300">
                                        <span className="flex items-center gap-1"><Truck className="h-4 w-4" /> Domicilio{isFeeManual ? ' (manual)' : ''}</span>
                                        <span>{isCalculatingFee ? 'Calculando…' : `+${formatCurrency(deliveryFee)}`}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                                    <span className="text-slate-200">TOTAL A PAGAR</span>
                                    <span className="text-2xl font-black text-amber-300">{formatCurrency(finalTotal)}</span>
                                </div>
                            </div>

                            {!canSubmit && (
                                <p className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-amber-200/90" role="status">
                                    Para crear: {missing.join(' · ')}
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={handleCreate}
                                disabled={!canSubmit}
                                className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 text-base font-black text-slate-950 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-200"
                            >
                                {isSaving ? (<><Loader2 className="h-5 w-5 animate-spin" /> Creando orden…</>) : `Crear orden · ${formatCurrency(finalTotal)}`}
                            </button>
                        </div>
                    </section>
                </div>

                {/* Bottom sheet for variants */}
                {sheetCard && (
                    <div className="absolute inset-0 z-10 flex items-end justify-center bg-slate-950/70" onClick={() => setSheetId(null)}>
                        <div
                            className="max-h-[80%] w-full overflow-y-auto rounded-t-3xl border-t border-slate-700 bg-slate-900 p-5 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                            aria-label={`Personalizar ${sheetCard.name}`}
                        >
                            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-700" />
                            <div className="mb-1 flex items-start justify-between gap-3">
                                <div>
                                    <h4 className="text-lg font-black text-white">{sheetCard.name}</h4>
                                    <p className="text-sm text-slate-400">Base {formatCurrency(sheetCard.price)}{sheetExtrasTotal > 0 && <span className="text-amber-300"> + {formatCurrency(sheetExtrasTotal)} extras</span>} · Total {formatCurrency(sheetUnitPrice)}</p>
                                </div>
                                <button type="button" onClick={() => setSheetId(null)} aria-label="Cerrar personalización" className="flex min-h-12 min-w-12 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 cursor-pointer"><X className="h-6 w-6" /></button>
                            </div>
                            {sheetToppings.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Adiciones</p>
                                    {sheetToppings.map((ing) => (
                                        <label key={ing.id} className="flex min-h-12 cursor-pointer items-center justify-between rounded-xl border border-slate-800 px-3 py-2 text-base text-slate-200 active:bg-slate-800">
                                            <span>{ing.name}</span>
                                            <span className="flex items-center gap-2">
                                                <span className="text-sm text-slate-500">+{formatCurrency(ing.price)}</span>
                                                <input type="checkbox" checked={sheetIngredients.includes(ing.id)} onChange={() => setSheetIngredients((c) => c.includes(ing.id) ? c.filter((id) => id !== ing.id) : [...c, ing.id])} className="h-5 w-5 accent-amber-500" />
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                            {catalog.sauces.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Salsas</p>
                                    <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-base font-bold text-amber-200 active:bg-amber-500/20">
                                        <input type="checkbox" checked={allSaucesSelected} onChange={toggleAllSauces} className="h-5 w-5 accent-amber-500" />Seleccionar todas las salsas
                                    </label>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {catalog.sauces.map((sauce) => (
                                            <label key={sauce.id} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-slate-800 px-3 py-2 text-base text-slate-200 active:bg-slate-800">
                                                <input type="checkbox" checked={sheetSauces.includes(sauce.id)} onChange={() => setSheetSauces((c) => c.includes(sauce.id) ? c.filter((id) => id !== sauce.id) : [...c, sauce.id])} className="h-5 w-5 accent-amber-500" />{sauce.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <button type="button" onClick={confirmSheet} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 text-base font-black text-slate-950 cursor-pointer active:scale-[0.99]">
                                <Plus className="h-5 w-5" /> Agregar · {formatCurrency(sheetUnitPrice)}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <LocationPickerModal
                isOpen={isMapOpen}
                onClose={() => setIsMapOpen(false)}
                onSelectLocation={handleLocationSelected}
                initialAddress={contact.address}
            />
        </div>
    )
}
