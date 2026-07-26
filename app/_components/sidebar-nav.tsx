"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Role } from "../../types/User"
import { navItems } from "../constants/constants"
import { logoutAction } from "@/app/(protected)/dashboard/actions"
import { LogOut } from "lucide-react"

export default function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname()
  const activeNavItems = navItems.filter(link => link.roles.includes(role));
  return (
    <nav className="flex-1 py-4 px-3 flex flex-col gap-1.5 overflow-y-auto">
      {activeNavItems.map(({ href, icon: Icon, label }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3.5 px-4 py-3 text-sm rounded-xl font-bold transition-all ${
              isActive
                ? "bg-stone-100 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
            }`}
          >
            <Icon
              size={18}
              strokeWidth={isActive ? 2.5 : 2}
              className="shrink-0"
            />
            <span>{label}</span>
          </Link>
        )
      })}

      <div className="mt-auto pt-4 border-t border-slate-800/80">
        <button
          onClick={async () => {
            await logoutAction()
          }}
          className="flex items-center gap-3.5 px-4 py-3 text-sm font-bold rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 w-full text-left transition-all"
        >
          <LogOut size={18} strokeWidth={2} className="shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </nav>
  )
}


