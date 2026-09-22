import { Bike } from "lucide-react";
import { getDeliveryDrivers, getDomiciliariosKPIs, getDeliveryLogs } from "../_actions/domiciliarios";
import DomiciliariosClient from "./_components/DomiciliariosClient";

export default async function DomiciliariosPage() {
  const [drivers, kpis, logs] = await Promise.all([
    getDeliveryDrivers(),
    getDomiciliariosKPIs(),
    getDeliveryLogs(undefined, 50),
  ]);

  return (
    <div className="flex flex-col gap-8 px-5 py-7 lg:px-8 lg:py-8 max-w-6xl w-full mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: "var(--color-text)" }}
          >
            <Bike className="text-amber-400" size={28} />
            Módulo de Domiciliarios
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            Registra repartidores, monitorea sus envíos y analiza sus métricas y KPIs en tiempo real.
          </p>
        </div>
      </header>

      <DomiciliariosClient initialDrivers={drivers} initialKpis={kpis} initialLogs={logs} />
    </div>
  );
}
