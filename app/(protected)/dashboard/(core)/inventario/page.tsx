import { Boxes } from "lucide-react";
import { getInventoryOverview, getInventoryMovements } from "../_actions/inventario";
import { InventarioClient } from "./_components/InventarioClient";

export const metadata = {
  title: "Inventario | CheesePapas Admin",
  description: "Controla existencias de ingredientes por punto (CABA / PUESTO).",
};

export default async function InventarioPage() {
  const [overview, rawMovements] = await Promise.all([
    getInventoryOverview(),
    getInventoryMovements({ limit: 100 }),
  ]);

  const movements = rawMovements.map((m) => ({
    ...m,
    createdAt: String(m.createdAt),
  }));

  return (
    <div className="flex flex-col gap-8 px-5 py-7 lg:px-8 lg:py-8 max-w-6xl w-full mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest mb-0.5 font-semibold text-slate-400">
            Configuración Core
          </p>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-100">
            <Boxes className="text-amber-400" size={24} />
            Inventario de Ingredientes
          </h1>
          <p className="text-sm mt-0.5 text-slate-400">
            Existencias por punto, entradas, ajustes y traslados entre CABA y PUESTO.
          </p>
        </div>
      </header>

      <InventarioClient
        locations={overview.locations}
        rows={overview.rows}
        initialMovements={movements}
      />
    </div>
  );
}
