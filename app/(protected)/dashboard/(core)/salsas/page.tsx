import { Sparkles } from "lucide-react";
import { getSauces } from "../_actions/salsas";
import { SalsasClient } from "./_components/SalsasClient";

export default async function SalsasPage() {
  const rawData = await getSauces();

  const data = rawData.map((s) => ({
    ...s,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  }));

  return (
    <div className="flex flex-col gap-8 px-5 py-7 lg:px-8 lg:py-8 max-w-5xl w-full mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: "var(--color-text)" }}
          >
            <Sparkles className="text-blue-500" size={24} />
            Gestión de Salsas
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            Administra las opciones de salsas disponibles en la aplicación de autoservicio.
          </p>
        </div>
      </header>

      <SalsasClient initialData={data} />
    </div>
  );
}
