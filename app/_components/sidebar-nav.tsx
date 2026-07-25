"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Calendar, UserPlus, Shield, LogOut } from "lucide-react"
import { Role } from "../../types/User"
import { navItems } from "../constants/constants"
import { logoutAction } from "@/app/(protected)/dashboard/actions"

export default function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname()
  const activeNavItems = navItems.filter(link => link.roles.includes(role));
  return (
    <nav className="flex-1 py-4 flex flex-col gap-0.5">

      {activeNavItems.map(({ href, icon: Icon, label }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            className={[
              "flex items-center gap-3 px-4 py-2.5 text-sm rounded-sm transition-all duration-150",
              "border-l-2",
              isActive
                ? "border-l-primary bg-background text-text font-medium"
                : "border-l-transparent text-text-muted hover:text-text hover:bg-background",
            ].join(" ")}
          >
            <Icon
              size={15}
              strokeWidth={isActive ? 2 : 1.5}
              className="shrink-0"
            />
            <span>{label}</span>
          </Link>
        )
      })}

      <button
        onClick={async () => {
          await logoutAction()
        }}
        className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-sm transition-all duration-150 border-l-2 border-l-transparent text-text-muted hover:text-danger hover:bg-background w-full text-left"
        style={{ background: "none", cursor: "pointer", border: "none" }}
      >
        <LogOut size={15} strokeWidth={1.5} className="shrink-0" />
        <span>Cerrar sesión</span>
      </button>
    </nav>
  )
}
