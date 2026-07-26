import { LayoutDashboard, UserPlus, Flame, Package, GlassWater, Utensils, Settings, TrendingUp } from "lucide-react";
import { NavItem } from "../../types/User";

export const navItems: NavItem[] = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["SUPER_ADMIN", "ADMIN"] },
    { href: "/kpis", icon: TrendingUp, label: "KPIs / Métricas", roles: ["SUPER_ADMIN", "ADMIN"] },
    { href: "/dashboard/add-user", icon: UserPlus, label: "Agregar Staff", roles: ["SUPER_ADMIN", "ADMIN"] },
    { href: "/dashboard/productos", icon: Utensils, label: "Productos", roles: ["SUPER_ADMIN", "ADMIN"] },
    { href: "/dashboard/ingredientes", icon: Package, label: "Ingredientes", roles: ["SUPER_ADMIN", "ADMIN"] },
    { href: "/dashboard/bebidas", icon: GlassWater, label: "Bebidas", roles: ["SUPER_ADMIN", "ADMIN"] },
    { href: "/dashboard/salsas", icon: Flame, label: "Salsas", roles: ["SUPER_ADMIN", "ADMIN"] },
    { href: "/dashboard/configuracion", icon: Settings, label: "Configuración", roles: ["SUPER_ADMIN", "ADMIN"] },
]

