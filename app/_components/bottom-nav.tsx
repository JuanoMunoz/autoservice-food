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
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center overflow-x-auto whitespace-nowrap hide-scrollbar px-2 py-2"
      style={{
        background: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      {activeNavItems.map(({ href, icon: Icon, label }) => {
        const isActive =
          pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 px-4 py-1"
          >
            <Icon
              size={20}
              strokeWidth={isActive ? 2 : 1.5}
              style={{
                color: isActive
                  ? "var(--color-primary)"
                  : "var(--color-text-muted)",
              }}
            />
            <span
              className="text-[10px] font-medium"
              style={{
                color: isActive
                  ? "var(--color-primary)"
                  : "var(--color-text-muted)",
              }}
            >
              {label}
            </span>
          </Link>
        )
      })}

      <button
        onClick={async () => {
          await logoutAction()
        }}
        className="flex flex-col items-center gap-1 px-4 py-1"
        style={{
          color: "var(--color-text-muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <LogOut size={20} strokeWidth={1.5} />
        <span className="text-[10px] font-medium">Salir</span>
      </button>
    </nav>
  )
}
