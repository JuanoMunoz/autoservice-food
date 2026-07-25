import { requireSession } from "@/utils/auth"

export default async function DashboardPage() {
    const session = await requireSession()


    return (
        <div className="flex flex-col gap-8 px-5 py-7 lg:px-8 lg:py-8 max-w-5xl">
            {/* Header */}
            <header>
                <p
                    className="text-xs uppercase tracking-widest mb-0.5"
                    style={{ color: "var(--color-text-muted)" }}
                >
                    Bienvenido
                </p>
                <h1
                    className="text-2xl font-semibold"
                    style={{ color: "var(--color-text)" }}
                >
                    {session.user.name}
                </h1>
                <p
                    className="text-sm mt-0.5"
                    style={{ color: "var(--color-text-muted)" }}
                >
                    {session.user.email} · {session.user.role}
                </p>
            </header>
        </div>
    )
}