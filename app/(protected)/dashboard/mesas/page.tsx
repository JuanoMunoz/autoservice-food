import { Table2 } from "lucide-react";
import { getTables } from "../_actions/tables";
import TablesClient from "./_components/TablesClient";

export const metadata = {
    title: "Mesas | CheesePapas Admin",
    description: "Administra las mesas disponibles para pedidos en el local.",
};

export default async function TablesPage() {
    const tables = await getTables();

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-7 lg:px-8 lg:py-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                        Configuración del local
                    </p>
                    <h1 className="flex items-center gap-2 text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                        <Table2 className="text-blue-500" size={24} /> Gestión de Mesas
                    </h1>
                    <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
                        Crea, edita, desactiva y elimina las mesas del establecimiento.
                    </p>
                </div>
            </header>
            <TablesClient initialData={tables} />
        </div>
    );
}
