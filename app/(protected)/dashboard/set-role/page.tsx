import { redirect } from "next/navigation"
import { getAllUsersAction } from "../actions"
import SetRoleList from "./_components/set-role-list"

export default async function SetRolePage() {
    const result = await getAllUsersAction()

    if ("error" in result) {
        redirect("/dashboard/unauthorized")
    }

    // Serializar fechas para pasar al Client Component
    const serializedUsers = result.users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as "SUPER_ADMIN" | "ADMIN" | "USER",
        createdAt: u.createdAt.toISOString(),
    }))

    return (
        <div className="flex flex-col gap-6 px-5 py-7 lg:px-8 lg:py-8 max-w-4xl">
            <header>
                <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: "var(--color-text-muted)" }}>
                    Configuración
                </p>
                <h1 className="text-2xl font-semibold text-text">
                    Asignar Roles
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                    Modifica los privilegios de los usuarios del sistema de forma segura.
                </p>
            </header>

            <SetRoleList initialUsers={serializedUsers} />
        </div>
    )
}
