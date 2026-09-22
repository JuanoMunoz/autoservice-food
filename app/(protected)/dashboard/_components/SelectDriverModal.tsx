'use client';

import { useEffect, useState } from 'react';
import { Bike, Check, User, X, MapPin, DollarSign, Store } from 'lucide-react';
import { getActiveDeliveryDrivers } from '../(core)/_actions/domiciliarios';
import { OrderResponse } from '@/types/Order';
import { formatCurrency } from '@/utils/cartStorage';

interface ActiveDriver {
  id: string;
  name: string;
  phone?: string | null;
  vehicle?: string | null;
  licensePlate?: string | null;
}

interface SelectDriverModalProps {
  order: OrderResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (driverId: string | null, notes?: string) => Promise<void>;
}

export default function SelectDriverModal({
  order,
  isOpen,
  onClose,
  onConfirm,
}: SelectDriverModalProps) {
  const [drivers, setDrivers] = useState<ActiveDriver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingDrivers(true);
      getActiveDeliveryDrivers()
        .then((data) => {
          setDrivers(data || []);
          // Auto-select first active driver if available
          if (data && data.length > 0) {
            setSelectedDriverId(data[0].id);
          } else {
            setSelectedDriverId(null);
          }
        })
        .catch((err) => console.error('Error fetching drivers:', err))
        .finally(() => setIsLoadingDrivers(false));
    } else {
      setNotes('');
      setSelectedDriverId(null);
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm(selectedDriverId, notes);
      onClose();
    } catch (err) {
      console.error('Error in select driver confirmation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 select-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Finalizar Orden #{order.id}
              </h3>
              <p className="text-xs text-slate-400">
                Selecciona el domiciliario asignado para esta entrega
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Details Summary */}
        <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-850 flex flex-wrap justify-between items-center gap-2 text-xs">
          <div className="space-y-0.5">
            <p className="font-bold text-white flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {order.buyerName || 'Cliente'}
            </p>
            <p className="text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              {order.onSite ? 'Consumo Presencial / En Local' : order.address || 'Domicilio'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Total Pedido</span>
            <span className="text-base font-black text-emerald-400">
              {formatCurrency(parseFloat(order.total))}
            </span>
          </div>
        </div>

        {/* Driver Selection List */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Asignar Domiciliario Encargado:
            </label>

            {isLoadingDrivers ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-850">
                Cargando domiciliarios activos...
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {/* Option: Sin domiciliario / Entrega presencial */}
                <div
                  onClick={() => setSelectedDriverId(null)}
                  className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    selectedDriverId === null
                      ? 'bg-amber-500/10 border-amber-500/50 text-white'
                      : 'bg-slate-950/50 border-slate-850 text-slate-400 hover:border-slate-750'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center text-xs">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        Entrega Directa / En Local (Sin Domiciliario)
                      </p>
                      <p className="text-[10px] text-slate-500">
                        El cliente retira en caja o consume en mesa
                      </p>
                    </div>
                  </div>
                  {selectedDriverId === null && (
                    <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Driver List */}
                {drivers.map((driver) => {
                  const isSelected = selectedDriverId === driver.id;
                  return (
                    <div
                      key={driver.id}
                      onClick={() => setSelectedDriverId(driver.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 text-white'
                          : 'bg-slate-950/50 border-slate-850 text-slate-400 hover:border-slate-750'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-800 text-amber-400'
                          }`}
                        >
                          <Bike className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{driver.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {driver.vehicle || 'Vehículo'} {driver.phone ? `• Tel: ${driver.phone}` : ''}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Optional Delivery Notes */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Notas / Observaciones del envío (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Entregado con cambio de $20.000, rápido despacho..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl transition text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl transition text-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Confirmar y Completar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
