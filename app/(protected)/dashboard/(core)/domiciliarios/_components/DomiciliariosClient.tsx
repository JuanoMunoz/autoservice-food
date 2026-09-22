"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Bike,
  Plus,
  Phone,
  Car,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  DollarSign,
  Calendar,
  Search,
  Edit2,
  Trash2,
  X,
  History,
  Users,
  ShieldAlert,
} from "lucide-react";
import {
  createDeliveryDriver,
  updateDeliveryDriver,
  deleteDeliveryDriver,
  toggleDeliveryDriverStatus,
  CreateDriverInput,
} from "../../_actions/domiciliarios";

interface Driver {
  id: string;
  name: string;
  phone?: string | null;
  vehicle?: string | null;
  licensePlate?: string | null;
  active: boolean;
  totalDeliveries: number;
  totalAmount: number;
  lastDelivery?: string | Date | null;
  createdAt: string | Date;
}

interface KPIProps {
  totalDeliveriesGlobal: number;
  totalAmountGlobal: number;
  topDriver: {
    id: string;
    name: string;
    trips: number;
    totalMoney: number;
  } | null;
  drivers: Array<{
    id: string;
    name: string;
    phone?: string | null;
    vehicle?: string | null;
    licensePlate?: string | null;
    active: boolean;
    trips: number;
    totalMoney: number;
    avgMoney: number;
    lastDelivery?: string | Date | null;
    recentDeliveries: Array<{
      id: string;
      orderId: number;
      buyerName: string;
      address: string;
      orderTotal: number;
      date: string | Date;
    }>;
  }>;
}

interface LogItem {
  id: string;
  orderId: number;
  driverId: string;
  orderTotal: number;
  notes?: string | null;
  createdAt: string | Date;
  driver: {
    name: string;
    phone?: string | null;
    vehicle?: string | null;
  };
  order: {
    id: number;
    buyerName: string;
    buyerPhone?: string | null;
    address: string;
    onSite: boolean;
    total: number;
    createdAt: string | Date;
  };
}

interface DomiciliariosClientProps {
  initialDrivers: Driver[];
  initialKpis: KPIProps;
  initialLogs: LogItem[];
}

export default function DomiciliariosClient({
  initialDrivers,
  initialKpis,
  initialLogs,
}: DomiciliariosClientProps) {
  const [activeTab, setActiveTab] = useState<"drivers" | "kpis" | "logs">("drivers");
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [kpis, setKpis] = useState<KPIProps>(initialKpis);
  const [logs, setLogs] = useState<LogItem[]>(initialLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDriverFilter, setSelectedDriverFilter] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState<CreateDriverInput>({
    name: "",
    phone: "",
    vehicle: "Moto",
    licensePlate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal State
  const [deletingDriver, setDeletingDriver] = useState<Driver | null>(null);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateVal?: string | Date | null) => {
    if (!dateVal) return "Sin registros";
    const date = new Date(dateVal);
    return date.toLocaleString("es-CO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenCreateModal = () => {
    setEditingDriver(null);
    setFormData({ name: "", phone: "", vehicle: "Moto", licensePlate: "" });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone || "",
      vehicle: driver.vehicle || "Moto",
      licensePlate: driver.licensePlate || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("El nombre del domiciliario es requerido.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingDriver) {
        const updated = await updateDeliveryDriver(editingDriver.id, formData);
        toast.success(`Domiciliario "${updated.name}" actualizado correctamente.`);
      } else {
        const created = await createDeliveryDriver(formData);
        toast.success(`Domiciliario "${created.name}" registrado correctamente.`);
      }
      setIsModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Ocurrió un error al guardar el domiciliario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (driver: Driver) => {
    try {
      const updated = await toggleDeliveryDriverStatus(driver.id);
      setDrivers((prev) =>
        prev.map((d) => (d.id === driver.id ? { ...d, active: updated.active } : d))
      );
      toast.success(
        `Domiciliario "${driver.name}" ${updated.active ? "activado" : "desactivado"}.`
      );
    } catch (err) {
      toast.error("Error al cambiar el estado del domiciliario.");
    }
  };

  const handleDeleteDriver = async () => {
    if (!deletingDriver) return;
    try {
      await deleteDeliveryDriver(deletingDriver.id);
      setDrivers((prev) => prev.filter((d) => d.id !== deletingDriver.id));
      toast.success(`Domiciliario "${deletingDriver.name}" eliminado.`);
      setDeletingDriver(null);
    } catch (err) {
      toast.error("No se pudo eliminar el domiciliario.");
    }
  };

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.phone && d.phone.includes(searchTerm)) ||
      (d.licensePlate && d.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredLogs = logs.filter((log) => {
    const matchesDriver =
      selectedDriverFilter === "all" || log.driverId === selectedDriverFilter;
    const matchesSearch =
      log.orderId.toString().includes(searchTerm) ||
      log.driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.order.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.order.address.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesDriver && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 pb-2 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("drivers")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "drivers"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Users className="w-4 h-4" />
          Directorio ({drivers.length})
        </button>

        <button
          onClick={() => setActiveTab("kpis")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "kpis"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          KPIs & Desempeño
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "logs"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <History className="w-4 h-4" />
          Historial de Envíos ({logs.length})
        </button>
      </div>

      {/* Global Stat Cards (Visible on KPIs & Drivers tab) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Entregas Totales</p>
            <p className="text-2xl font-black text-white">{kpis.totalDeliveriesGlobal}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Total Recaudado/Enviado</p>
            <p className="text-xl font-black text-emerald-400">
              {formatMoney(kpis.totalAmountGlobal)}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Domiciliario #1</p>
            <p className="text-base font-bold text-white truncate max-w-[150px]">
              {kpis.topDriver ? kpis.topDriver.name : "N/A"}
            </p>
            {kpis.topDriver && (
              <p className="text-xs text-purple-300 font-semibold">
                {kpis.topDriver.trips} viajes realizados
              </p>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Domiciliarios Activos</p>
            <p className="text-2xl font-black text-white">
              {drivers.filter((d) => d.active).length} / {drivers.length}
            </p>
          </div>
        </div>
      </div>

      {/* TAB 1: DIRECTORY / CRUD */}
      {activeTab === "drivers" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono o placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl transition shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              Nuevo Domiciliario
            </button>
          </div>

          {filteredDrivers.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
              <Bike className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-300">
                No hay domiciliarios registrados
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Haz clic en "Nuevo Domiciliario" para comenzar a agregar repartidores a tu equipo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    driver.active
                      ? "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                      : "bg-slate-950/60 border-slate-900 opacity-70"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                          driver.active
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        <Bike className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base leading-tight">
                          {driver.name}
                        </h4>
                        <span
                          className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-black rounded-md ${
                            driver.active
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {driver.active ? "ACTIVO" : "INACTIVO"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(driver)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Editar domiciliario"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingDriver(driver)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Eliminar domiciliario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 mb-4 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{driver.phone || "Sin teléfono registrado"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {driver.vehicle || "Vehículo N/A"}{" "}
                        {driver.licensePlate ? `(${driver.licensePlate})` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                    <div>
                      <p className="text-slate-500">Viajes completados</p>
                      <p className="font-bold text-white text-sm">
                        {driver.totalDeliveries} envíos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500">Total despachado</p>
                      <p className="font-bold text-amber-400 text-sm">
                        {formatMoney(driver.totalAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <button
                      onClick={() => handleToggleStatus(driver)}
                      className={`w-full py-1.5 rounded-xl font-bold text-xs transition border ${
                        driver.active
                          ? "bg-slate-900 text-rose-400 border-rose-500/20 hover:bg-rose-500/10"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                      }`}
                    >
                      {driver.active ? "Desactivar Domiciliario" : "Activar Domiciliario"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KPIS & DESEMPEÑO */}
      {activeTab === "kpis" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-amber-400 w-5 h-5" />
              Desglose de KPIs por Domiciliario
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs text-slate-400 uppercase font-mono">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Domiciliario</th>
                    <th className="p-3.5">Vehículo / Placa</th>
                    <th className="p-3.5 text-center">Viajes Totales</th>
                    <th className="p-3.5 text-right">Total Dinero Mover</th>
                    <th className="p-3.5 text-right">Promedio / Entrega</th>
                    <th className="p-3.5 text-right rounded-r-xl">Último Envío</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {kpis.drivers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500">
                        No hay datos estadísticos registrados aún.
                      </td>
                    </tr>
                  ) : (
                    kpis.drivers.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-850/50 transition">
                        <td className="p-3.5 font-bold text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs">
                            <Bike className="w-3.5 h-3.5" />
                          </div>
                          {d.name}
                        </td>
                        <td className="p-3.5 text-xs text-slate-400">
                          {d.vehicle || "N/A"} {d.licensePlate ? `(${d.licensePlate})` : ""}
                        </td>
                        <td className="p-3.5 text-center font-bold text-amber-400">
                          {d.trips}
                        </td>
                        <td className="p-3.5 text-right font-black text-emerald-400">
                          {formatMoney(d.totalMoney)}
                        </td>
                        <td className="p-3.5 text-right font-medium text-slate-300">
                          {formatMoney(d.avgMoney)}
                        </td>
                        <td className="p-3.5 text-right text-xs text-slate-400">
                          {formatDate(d.lastDelivery)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOGS / HISTORIAL */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por # Orden, cliente o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <select
              value={selectedDriverFilter}
              onChange={(e) => setSelectedDriverFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">Todos los domiciliarios</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs text-slate-400 uppercase font-mono">
                  <tr>
                    <th className="p-3.5"># Orden</th>
                    <th className="p-3.5">Domiciliario</th>
                    <th className="p-3.5">Cliente</th>
                    <th className="p-3.5">Dirección / Tipo</th>
                    <th className="p-3.5 text-right">Valor Orden</th>
                    <th className="p-3.5 text-right">Fecha / Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No se encontraron registros de envíos.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-850/50 transition">
                        <td className="p-3.5 font-mono font-bold text-amber-400">
                          #{log.orderId}
                        </td>
                        <td className="p-3.5 font-bold text-white flex items-center gap-2">
                          <Bike className="w-4 h-4 text-amber-400" />
                          {log.driver.name}
                        </td>
                        <td className="p-3.5 text-slate-200">{log.order.buyerName}</td>
                        <td className="p-3.5 text-xs text-slate-400 max-w-xs truncate">
                          {log.order.onSite ? "Consumo Local" : log.order.address}
                        </td>
                        <td className="p-3.5 text-right font-bold text-emerald-400">
                          {formatMoney(log.orderTotal)}
                        </td>
                        <td className="p-3.5 text-right text-xs text-slate-400">
                          {formatDate(log.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Bike className="text-amber-400 w-5 h-5" />
                {editingDriver ? "Editar Domiciliario" : "Registrar Domiciliario"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Teléfono / Celular
                </label>
                <input
                  type="text"
                  placeholder="Ej. 300 123 4567"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Vehículo
                  </label>
                  <select
                    value={formData.vehicle || "Moto"}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Moto">Motocicleta</option>
                    <option value="Bicicleta">Bicicleta</option>
                    <option value="Carro">Carro</option>
                    <option value="A pie">A pie</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Placa (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. ABC-123"
                    value={formData.licensePlate || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, licensePlate: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl transition text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl transition text-sm disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Guardando..."
                    : editingDriver
                    ? "Actualizar"
                    : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">¿Eliminar domiciliario?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Estás a punto de eliminar a{" "}
                <span className="font-bold text-white">{deletingDriver.name}</span>. Esta
                acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingDriver(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteDriver}
                className="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-bold py-2 rounded-xl text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
