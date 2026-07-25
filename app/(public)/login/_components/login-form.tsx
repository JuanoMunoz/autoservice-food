"use client"

import { useState } from "react"
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { loginAction } from "../actions"
export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Completa todos los campos")
      return
    }
    setLoading(true)
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    await loginAction(formData)
    setLoading(false)
    toast.error("Credenciales incorrectas")
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.75rem",
    fontSize: "0.875rem",
    background: "var(--color-surface)",
    color: "var(--color-text)",
    border: "1px solid var(--color-border)",
    borderRadius: "4px",
    outline: "none",
    transition: "border-color 150ms",
    fontFamily: "inherit",
  }

  const inputFocusProps = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = "var(--color-primary)"
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = "var(--color-border)"
    },
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Email */}
      <label className="flex flex-col gap-1.5">
        <span
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: "var(--color-text-muted)" }}
        >
          Correo electrónico
        </span>
        <input
          id="login-email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="nombre@dominio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          {...inputFocusProps}
        />
      </label>

      {/* Password */}
      <label className="flex flex-col gap-1.5">
        <span
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: "var(--color-text-muted)" }}
        >
          Contraseña
        </span>
        <div className="relative">
          <input
            name="password"
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle, paddingRight: "2.5rem" }}
            {...inputFocusProps}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--color-text-muted)" }}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff size={15} strokeWidth={1.5} />
            ) : (
              <Eye size={15} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </label>

      {/* Submit */}
      <button
        id="login-submit"
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm font-medium rounded-sm transition-all duration-150 mt-2"
        style={{
          background: loading
            ? "var(--color-border)"
            : "var(--color-text)",
          color: "var(--color-surface)",
          cursor: loading ? "not-allowed" : "pointer",
          border: "none",
        }}
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <>
            Iniciar sesión
            <ArrowRight size={14} strokeWidth={2} />
          </>
        )}
      </button>
    </form>
  )
}
