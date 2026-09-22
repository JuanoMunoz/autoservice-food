'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Search, Plus, Minus, Trash2, X, ShoppingBag, UserRound } from 'lucide-react'
import { createAdminOrder, findLatestCustomerByPhone } from '../actions'
import type { AdminCustomerContact, AdminOrderCatalog } from '@/types/AdminOrder'
import type { CartItem, OrderResponse } from '@/types/Order'
import { formatCurrency } from '@/utils/cartStorage'

interface CreateOrderModalProps {
    catalog: AdminOrderCatalog
    onClose: () => void
    onCreated: (order: OrderResponse) => void
}

type CatalogMode = 'product' | 'drink'

interface DraftLine {
    id: string
    label: string
    price: number
    quantity: number
    item: CartItem
}

const emptyContact: AdminCustomerContact = {
    name: '',
    phone: '',
    email: '',
    address: '',
    onSite: true,
}

export default function CreateOrderModal({ catalog, onClose, onCreated }: CreateOrderModalProps) {
    const [contact, setContact] = useState(emptyContact)
    const [mode, setMode] = useState<CatalogMode>('product')
    const [selectedId, setSelectedId] = useState('')
    const [quantity, setQuantity] = useState(1)
    const [ingredientIds, setIngredientIds] = useState<string[]>([])
    const [sauceIds, setSauceIds] = useState<string[]>([])
    const [lines, setLines] = useState<DraftLine[]>([])
    const [isSearching, startSearch] = useTransition()
    const [isSaving, startSaving] = useTransition()

    const selectedProduct = catalog.products.find((product) => product.id === selectedId)
    const selectedDrink = catalog.drinks.find((drink) => drink.id === selectedId)
    const selectedIngredients = selectedProduct?.productIngredients
        .map(({ ingredient }) => ingredient)
        .filter((ingredient) => ingredient.isTopping) ?? []
    const selectedSauces = catalog.sauces.filter((sauce) => sauceIds.includes(sauce.id))
    const selectedCatalogItem = mode === 'product' ? selectedProduct : selectedDrink
    const selectedExtrasTotal = selectedProduct?.productIngredients
        .filter(({ ingredient }) => ingredientIds.includes(ingredient.id))
        .reduce((sum, { ingredient }) => sum + ingredient.price, 0) ?? 0
    const selectedUnitPrice = (selectedCatalogItem?.price ?? 0) + selectedExtrasTotal
    const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)

    const updateContact = (field: keyof AdminCustomerContact, value: string | boolean) => {
        setContact((current) => ({ ...current, [field]: value }))
    }

    const handleModeChange = (nextMode: CatalogMode) => {
        setMode(nextMode)
        setSelectedId('')
        setIngredientIds([])
        setSauceIds([])
    }

    const handleSearch = () => {
        if (!contact.phone.trim()) {
            toast.error('Escribe primero el número de celular')
            return
        }

        startSearch(async () => {
            const customer = await findLatestCustomerByPhone(contact.phone)
            if (!customer) {
                toast.info('No encontramos una orden anterior con ese celular')
                return
            }

            setContact({
                name: customer.buyerName,
                phone: customer.buyerPhone,
                email: customer.buyerEmail ?? '',
                address: customer.address,
                onSite: customer.onSite,
            })
            toast.success('Datos de contacto recuperados')
        })
    }

    const toggleIngredient = (ingredientId: string) => {
        setIngredientIds((current) => current.includes(ingredientId)
            ? current.filter((id) => id !== ingredientId)
            : [...current, ingredientId])
    }

    const toggleSauce = (sauceId: string) => {
        setSauceIds((current) => current.includes(sauceId)
            ? current.filter((id) => id !== sauceId)
            : [...current, sauceId])
    }

    const handleAddLine = () => {
        if (!selectedCatalogItem) {
            toast.error('Selecciona un producto o bebida')
            return
        }

        if (mode === 'product' && selectedProduct) {
            const item: CartItem = {
                type: 'product',
                id: selectedProduct.id,
                productId: selectedProduct.id,
                name: selectedProduct.name,
                description: selectedProduct.description,
                price: selectedProduct.price,
                quantity,
                ingredients: selectedProduct.productIngredients
                    .filter(({ ingredient }) => ingredientIds.includes(ingredient.id))
                    .map(({ ingredient }) => ({
                        id: ingredient.id,
                        name: ingredient.name,
                        price: ingredient.price,
                        quantity: 1,
                    })),
                sauces: selectedSauces,
            }
            setLines((current) => [...current, {
                id: crypto.randomUUID(),
                label: selectedProduct.name,
                price: selectedUnitPrice,
                quantity,
                item,
            }])
        } else if (selectedDrink) {
            const item: CartItem = {
                type: 'drink',
                id: selectedDrink.id,
                drinkId: selectedDrink.id,
                name: selectedDrink.name,
                description: selectedDrink.description,
                price: selectedDrink.price,
                quantity,
            }
            setLines((current) => [...current, {
                id: crypto.randomUUID(),
                label: selectedDrink.name,
                price: selectedDrink.price,
                quantity,
                item,
            }])
        }

        setSelectedId('')
        setQuantity(1)
        setIngredientIds([])
        setSauceIds([])
    }

    const handleCreate = () => {
        if (!contact.phone.trim() || !contact.name.trim()) {
            toast.error('El celular y el nombre son obligatorios')
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
                        reference: '',
                    },
                    paymentType: 'cash',
                    total,
                })
                toast.success(`Orden #${order.id} creada correctamente`)
                onCreated(order)
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'No se pudo crear la orden')
            }
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
            <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-amber-500/15 p-2 text-amber-300"><ShoppingBag className="h-5 w-5" /></div>
                        <div>
                            <h2 className="text-lg font-black text-white">Añadir orden</h2>
                            <p className="text-xs font-medium text-slate-400">Crea un pedido manual para un cliente</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Cerrar modal"><X className="h-5 w-5" /></button>
                </div>

                <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 lg:grid-cols-[0.85fr_1.15fr]">
                    <section className="space-y-4">
                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                            <div className="mb-3 flex items-center gap-2 text-sm font-black text-white"><UserRound className="h-4 w-4 text-amber-300" /> Datos del cliente</div>
                            <div className="flex gap-2">
                                <input value={contact.phone} onChange={(event) => updateContact('phone', event.target.value)} onKeyDown={(event) => event.key === 'Enter' && handleSearch()} placeholder="Número de celular" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" />
                                <button type="button" onClick={handleSearch} disabled={isSearching} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-slate-950 disabled:opacity-50"><Search className="h-4 w-4" /> Buscar</button>
                            </div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <input value={contact.name} onChange={(event) => updateContact('name', event.target.value)} placeholder="Nombre completo" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" />
                                <input value={contact.email} onChange={(event) => updateContact('email', event.target.value)} placeholder="Correo (opcional)" type="email" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" />
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <button type="button" onClick={() => updateContact('onSite', true)} className={`rounded-lg border px-3 py-2 text-xs font-black ${contact.onSite ? 'border-amber-400 bg-amber-500 text-slate-950' : 'border-slate-700 text-slate-400'}`}>En el local</button>
                                <button type="button" onClick={() => updateContact('onSite', false)} className={`rounded-lg border px-3 py-2 text-xs font-black ${!contact.onSite ? 'border-amber-400 bg-amber-500 text-slate-950' : 'border-slate-700 text-slate-400'}`}>A domicilio</button>
                            </div>
                            {!contact.onSite && <input value={contact.address} onChange={(event) => updateContact('address', event.target.value)} placeholder="Dirección de entrega" className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" />}
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                            <div className="mb-3 text-sm font-black text-white">Pedido</div>
                            <div className="mb-3 grid grid-cols-2 gap-2">
                                <button type="button" onClick={() => handleModeChange('product')} className={`rounded-lg border px-3 py-2 text-xs font-black ${mode === 'product' ? 'border-amber-400 bg-amber-500 text-slate-950' : 'border-slate-700 text-slate-400'}`}>Productos</button>
                                <button type="button" onClick={() => handleModeChange('drink')} className={`rounded-lg border px-3 py-2 text-xs font-black ${mode === 'drink' ? 'border-amber-400 bg-amber-500 text-slate-950' : 'border-slate-700 text-slate-400'}`}>Bebidas</button>
                            </div>
                            <select value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setIngredientIds([]); setSauceIds([]) }} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400">
                                <option value="">Selecciona un {mode === 'product' ? 'producto' : 'bebida'}</option>
                                {(mode === 'product' ? catalog.products : catalog.drinks).map((item) => <option key={item.id} value={item.id}>{item.name} · {formatCurrency(item.price)}</option>)}
                            </select>
                            <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                                <span className="text-xs font-bold text-slate-400">Cantidad</span>
                                <div className="flex items-center gap-3"><button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} className="rounded-md bg-slate-800 p-1.5 text-white"><Minus className="h-4 w-4" /></button><span className="w-5 text-center font-black text-white">{quantity}</span><button type="button" onClick={() => setQuantity((current) => current + 1)} className="rounded-md bg-slate-800 p-1.5 text-white"><Plus className="h-4 w-4" /></button></div>
                            </div>

                            {mode === 'product' && selectedProduct && selectedIngredients.length > 0 && (
                                <div className="mt-3 space-y-2"><p className="text-xs font-black uppercase tracking-wide text-slate-400">Adiciones</p>{selectedIngredients.map((ingredient) => <label key={ingredient.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-200"><span>{ingredient.name}</span><span className="flex items-center gap-2"><span className="text-xs text-slate-500">+{formatCurrency(ingredient.price)}</span><input type="checkbox" checked={ingredientIds.includes(ingredient.id)} onChange={() => toggleIngredient(ingredient.id)} className="accent-amber-400" /></span></label>)}</div>
                            )}
                            {mode === 'product' && selectedProduct && catalog.sauces.length > 0 && (
                                <div className="mt-3 space-y-2"><p className="text-xs font-black uppercase tracking-wide text-slate-400">Salsas</p><div className="grid grid-cols-2 gap-2">{catalog.sauces.map((sauce) => <label key={sauce.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-xs text-slate-200"><input type="checkbox" checked={sauceIds.includes(sauce.id)} onChange={() => toggleSauce(sauce.id)} className="accent-amber-400" />{sauce.name}</label>)}</div></div>
                            )}
                            <button type="button" onClick={handleAddLine} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2.5 text-sm font-black text-slate-950 hover:bg-amber-100"><Plus className="h-4 w-4" /> Agregar al pedido</button>
                        </div>
                    </section>

                    <section className="flex min-h-[260px] flex-col rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-black text-white">Resumen del pedido</h3><span className="text-xs font-bold text-slate-500">{lines.length} ítem(s)</span></div>
                        <div className="flex-1 space-y-2 overflow-y-auto">{lines.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">Agrega productos para comenzar</p> : lines.map((line) => <div key={line.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-black text-white">{line.quantity}x {line.label}</p><p className="text-xs text-slate-500">{formatCurrency(line.price)} c/u</p></div><div className="flex items-center gap-3"><span className="text-sm font-black text-amber-300">{formatCurrency(line.price * line.quantity)}</span><button type="button" onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))} className="text-slate-500 hover:text-rose-400" aria-label={`Eliminar ${line.label}`}><Trash2 className="h-4 w-4" /></button></div></div>)}</div>
                        <div className="mt-4 border-t border-slate-800 pt-4"><div className="mb-4 flex items-center justify-between"><span className="text-sm font-bold text-slate-400">Total</span><span className="text-2xl font-black text-white">{formatCurrency(total)}</span></div><button type="button" onClick={handleCreate} disabled={isSaving} className="w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/10 disabled:opacity-50">{isSaving ? 'Creando orden...' : 'Crear orden'}</button></div>
                    </section>
                </div>
            </div>
        </div>
    )
}
