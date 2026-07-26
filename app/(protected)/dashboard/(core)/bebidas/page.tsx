import { GlassWater } from "lucide-react";
import { getDrinks } from "../_actions/bebidas";
import { BebidasClient } from "./_components/BebidasClient";

export default async function BebidasPage() {
  const rawData = await getDrinks();

  const data = rawData.map((s) => ({
    ...s,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  }));

  return (
    <div className="flex flex-col gap-8 px-5 py-7 lg:px-8 lg:py-8 max-w-5xl w-full mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p
            className="text-xs uppercase tracking-widest mb-0.5 font-semibold"
            style={{ color: "var(--color-text-muted)" }}
          >
            Configuración Core
          </p>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: "var(--color-text)" }}
          >
            <GlassWater className="text-blue-500" size={24} />
            Gestión de Bebidas
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            Administra las bebidas disponibles en tu menú.
          </p>
        </div>
      </header>

      <BebidasClient initialData={data} />
    </div>
  );
}
