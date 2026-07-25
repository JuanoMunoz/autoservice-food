import Sidebar from "@/app/_components/sidebar"
import BottomNav from "@/app/_components/bottom-nav"
import { requireSession } from "@/utils/auth"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireSession()
  return (
    <div
      className="flex min-h-dvh"
      style={{ background: "var(--color-background)" }}
    >
      {/* Desktop sidebar */}
      <Sidebar session={session} />

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col lg:pl-56 pb-16 lg:pb-0 min-w-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <BottomNav role={session.user.role} />
    </div>
  )
}
