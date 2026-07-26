import { requireRole } from "@/utils/auth";
import { getKPIData } from "./_actions/kpis";
import KPIsClient from "./_components/KPIsClient";

export const metadata = {
  title: "KPIs & Analítica de Ventas | CheesePapas Admin",
  description: "Métricas clave de rendimiento, ventas en tiempo real e inteligencia del negocio.",
};

export default async function KPIsPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const initialData = await getKPIData();

  return <KPIsClient initialData={initialData} />;
}
