import SidebarNav from "./sidebar-nav"
import { parseRoleAsName } from "@/utils/utils";
import type { Role } from "@/types/User"
import { UtensilsCrossed } from "lucide-react"

export default function Sidebar({ session }: { session: { user: { name: string; role: string } } }) {
  const role = session.user.role as Role
  const roleName = parseRoleAsName(role)
  const userName = session.user.name || "Usuario"
  return (
    <aside className="hidden lg:flex flex-col fixed top-0 left-0 h-full w-60 z-30 bg-slate-950 border-r border-slate-800/80 shadow-2xl">
      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center font-black text-slate-950 shadow-md">
          <UtensilsCrossed className="w-5 h-5 text-slate-950" />
        </div>
        <div>
          <span className="text-lg font-saira font-extrabold tracking-tight text-stone-100">
            Cheese<span className="text-secondary">Papas</span>
          </span>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Panel de Control
          </p>
        </div>
      </div>

      {/* Nav links (client) */}
      <SidebarNav role={role} />

      {/* User info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-lg bg-stone-100 text-slate-950 flex items-center justify-center font-extrabold text-sm shrink-0 shadow-md">
            {userName[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-100 truncate">
              {userName}
            </p>
            <p className="text-[10px] font-semibold text-stone-200 truncate">
              {roleName}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}


