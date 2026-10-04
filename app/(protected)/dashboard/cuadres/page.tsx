import { HandCoins } from "lucide-react";
import { getDeliveryDrivers } from "../(core)/_actions/domiciliarios";
import CuadresClient from "./_components/CuadresClient";

export default async function CuadresPage() {
  const drivers = await getDeliveryDrivers();

  return (
    <div className="flex flex-col gap-8 px-5 py-7 lg:px-8 lg:py-8 max-w-6xl w-full mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-100">
            <HandCoins className="text-amber-400" size={28} />
            Cuadres con Domiciliarios
          </h1>
          <p className="text-sm mt-0.5 text-slate-400">
            Cuadra cada orden con su domiciliario: cóbrale el efectivo o págale su domicilio,
            y lleva el vendido neto de la tienda.
          </p>
        </div>
      </header>

      <CuadresClient initialDrivers={drivers} />
    </div>
  );
}
