"use client"

import { useState } from "react"
import { Pencil, Save, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateRoleAction } from "@/app/(protected)/dashboard/actions"
import type { Role, SerializedUser } from "@/types/User"


interface SetRoleListProps {
  initialUsers: SerializedUser[]
}

const ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "USER"]
const roleLabel: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrador",
  USER: "Usuario",
}

export default function SetRoleList({ initialUsers }: SetRoleListProps) {
  const [users, setUsers] = useState<SerializedUser[]>(initialUsers)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [saving, setSaving] = useState(false)

  const selectClass =
    "px-2 py-1.5 text-[13px] bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"

  async function handleSave(email: string) {
    if (!selectedRole) return

    setSaving(true)
    const formData = new FormData()
    formData.append("email", email)
    formData.append("role", selectedRole)

    try {
      const res = await updateRoleAction(formData)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("Rol actualizado con éxito")
        setUsers((prev) =>
          prev.map((u) =>
            u.email === email ? { ...u, role: selectedRole } : u
          )
        )
        setEditingUserId(null)
        setSelectedRole(null)
      }
    } catch (err) {
      toast.error("Ocurrió un error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Usuario
            </th>
            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Correo
            </th>
            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Rol
            </th>
            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {users.map((user) => {
            const isEditing = editingUserId === user.id

            return (
              <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 text-sm font-medium text-slate-100">
                  {user.name}
                </td>
                <td className="p-4 text-sm text-slate-400">
                  {user.email}
                </td>
                <td className="p-4 text-sm">
                  {isEditing ? (
                    <select
                      value={selectedRole || user.role}
                      onChange={(e) => setSelectedRole(e.target.value as Role)}
                      className={selectClass}
                    >
                      {ROLES.map((roleOpt) => (
                        <option key={roleOpt} value={roleOpt}>
                          {roleLabel[roleOpt]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                        user.role === "SUPER_ADMIN"
                          ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                          : user.role === "ADMIN"
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                      }`}
                    >
                      {roleLabel[user.role]}
                    </span>
                  )}
                </td>
                <td className="p-4 text-sm text-right">
                  {isEditing ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleSave(user.email)}
                        disabled={saving}
                        className="p-1.5 rounded-lg text-emerald-400 hover:bg-slate-800 transition-colors disabled:opacity-50" aria-label="Guardar"
                        title="Guardar"
                      >
                        {saving ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Save size={15} strokeWidth={2} />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingUserId(null)
                          setSelectedRole(null)
                        }}
                        disabled={saving}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-50" aria-label="Cancelar"
                        title="Cancelar"
                      >
                        <X size={15} strokeWidth={2} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingUserId(user.id)
                        setSelectedRole(user.role)
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors" aria-label="Editar rol"
                      title="Editar Rol"
                    >
                      <Pencil size={15} strokeWidth={1.5} />
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
