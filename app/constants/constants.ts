import { Calendar, LayoutDashboard, Shield, UserPlus, Building2, MapPin, CalendarDays, MonitorSmartphone } from "lucide-react";
import { NavItem } from "../../types/User";

export const navItems: NavItem[] = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["SUPER_ADMIN", "ADMIN"] },
    { href: "/dashboard/add-user", icon: UserPlus, label: "Agregar Staff", roles: ["SUPER_ADMIN", "ADMIN"] },
]
