"use client"

import { useState } from "react"
import { Loader2, Copy, Check, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import registerAction from "@/app/(protected)/dashboard/actions"

interface Credentials {
  name: string
  email: string
  password: string
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
        <span className="text-sm font-mono truncate text-slate-100">
          {value}
        </span>
        <button
          type="button"
          onClick={copy}
          className={`shrink-0 transition-colors ${copied ? "text-amber-400" : "text-slate-400 hover:text-slate-200"}`}
          aria-label={`Copiar ${label}`}
        >
          {copied ? (
            <Check size={13} strokeWidth={2} />
          ) : (
            <Copy size={13} strokeWidth={1.5} />
          )}
        </button>
      </div>
    </div>
  )
}

export default function AddUserForm() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [credentials, setCredentials] = useState<Credentials | null>(null)

  const inputClass =
    "w-full px-3 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-colors"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      toast.error("Completa todos los campos")
      return
    }
    setLoading(true)

    const fullName = `${firstName.trim()} ${lastName.trim()}`

    const formData = new FormData()
    formData.append("name", fullName)
    formData.append("email", email.trim())
    formData.append("password", password.trim())

    try {
      const res = await registerAction(formData)
      if (res?.error) {
        toast.error(res.error)
      } else {
        const creds: Credentials = {
          name: fullName,
          email: email.trim(),
          password: password.trim(),
        }
        setCredentials(creds)
        toast.success("Miembro registrado correctamente")
      }
    } catch (err) {
      toast.error("Ocurrió un error al registrar")
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setFirstName("")
    setLastName("")
    setEmail("")
    setPassword("")
    setCredentials(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Nombre
            </span>
            <input
              id="staff-firstname"
              name="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="María"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Apellido
            </span>
            <input
              id="staff-lastname"
              name="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="García"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Correo electrónico
          </span>
          <input
            id="staff-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="maria.garcia@test.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Contraseña
          </span>
          <input
            id="staff-password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>

        <button
          id="staff-submit"
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm font-black rounded-xl transition-all mt-1 bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-50 cursor-pointer min-h-11"
        >
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            "Generar credenciales"
          )}
        </button>
      </form>

      {/* Credenciales generadas */}
      {credentials && (
        <div className="flex flex-col gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest font-medium text-amber-400">
              Credenciales generadas
            </p>
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1.5 text-xs transition-colors text-slate-400 hover:text-slate-200"
            >
              <RefreshCw size={11} strokeWidth={1.5} />
              Nuevo
            </button>
          </div>

          <CopyField label="Nombre completo" value={credentials.name} />
          <CopyField label="Correo / usuario" value={credentials.email} />
          <CopyField label="Contraseña" value={credentials.password} />

          <p className="text-[11px] mt-1 text-slate-400">
            Miembro registrado en el sistema. Comparte las credenciales de forma segura.
          </p>
        </div>
      )}
    </div>
  )
}
