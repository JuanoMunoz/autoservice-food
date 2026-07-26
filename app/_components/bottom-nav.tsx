"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { navItems } from "../constants/constants"
import { Role } from "../../types/User";
import { LogOut } from "lucide-react"
import { logoutAction } from "@/app/(protected)/dashboard/actions"

export default function BottomNav({ role }: { role: Role }) {
  const activeNavItems = navItems.filter(link => link.roles.includes(role));
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around overflow-x-auto whitespace-nowrap px-3 py-2 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-2xl">
      {activeNavItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"))
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              isActive ? "text-stone-100 font-extrabold" : "text-slate-400 font-medium hover:text-slate-200"
            }`}
          >
            <div className={`p-1.5 rounded-lg ${isActive ? "bg-stone-100/15 text-stone-100" : ""}`}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            </div>
            <span className="text-[10px] tracking-tight">{label}</span>
          </Link>
        )
      })}

      <button
        onClick={async () => {
          await logoutAction()
        }}
        className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-rose-400 hover:text-rose-300 font-medium transition-all"
      >
        <div className="p-1.5 rounded-lg">
          <LogOut size={20} strokeWidth={1.8} />
        </div>
        <span className="text-[10px] tracking-tight">Salir</span>
      </button>
    </nav>
  )
}


