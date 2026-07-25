import SidebarNav from "./sidebar-nav"
import { parseRoleAsName } from "@/utils/utils";
import type { Role } from "@/types/User"


export default function Sidebar({ session }: { session: { user: { name: string; role: string } } }) {
  const role = session.user.role as Role
  const roleName = parseRoleAsName(role)
  const userName = session.user.name
  return (
    <aside
      className="hidden lg:flex flex-col fixed top-0 left-0 h-full w-56 z-30"
      style={{
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
      }}
    >
      {/* Logo */}
      <div
        className="px-5 py-5"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <span
          className="text-base font-bold tracking-tight"
          style={{ fontFamily: "var(--font-galindo)", color: "var(--color-text)" }}
        >
          Skeleton
        </span>
        <span
          className="text-base font-bold tracking-tight"
          style={{ fontFamily: "var(--font-galindo)", color: "var(--color-accent)" }}
        >
          .app
        </span>
      </div>

      {/* Nav links (client) */}
      <SidebarNav role={role} />

      {/* User info */}
      <div
        className="px-4 py-4"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-3">
          {/* Avatar con acento naranja */}
          <div
            className="w-8 h-8 rounded-sm flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              background: "var(--color-accent)",
              color: "#fff",
              letterSpacing: "0.02em",
            }}
          >
            {userName[0]}
          </div>
          <div className="min-w-0">
            <p
              className="text-xs font-medium truncate"
              style={{ color: "var(--color-text)" }}
            >
              {userName}
            </p>
            <p
              className="text-[10px] truncate"
              style={{ color: "var(--color-text-muted)" }}
            >
              {roleName}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
