import { checkSession } from "@/utils/auth";
import LoginForm from "./_components/login-form"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const session = await checkSession()
  if (session) redirect("/event")
  return (
    <main className="flex min-h-dvh">
      {/* Panel izquierdo — branding (solo desktop) */}
      <aside
        className="hidden lg:flex flex-col justify-between w-80 shrink-0 p-10"
        style={{
          background: "var(--color-surface)",
          borderRight: "1px solid var(--color-border)",
        }}
      >
        <div>
          <span
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-galindo)" }}
          >
            <span style={{ color: "var(--color-text)" }}>SKELETON</span>
            <span style={{ color: "var(--color-primary)" }}>.app</span>
          </span>
        </div>
        <div>
          <p
            className="text-xs uppercase tracking-widest mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            Pon tu texto aquí
          </p>
          <p
            className="text-2xl font-semibold leading-snug"
            style={{ color: "var(--color-text)" }}
          >
            Registra asistencia.{" "}
            <span style={{ color: "var(--color-primary)" }}>Sin fricción.</span>
          </p>
        </div>
        <p
          className="text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          © 2026 Skeleton.app
        </p>
      </aside>

      {/* Panel derecho — formulario */}
      <section className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="lg:hidden mb-8">
            <span
              className="text-xl font-bold"
              style={{ fontFamily: "var(--font-galindo)" }}
            >
              <span style={{ color: "var(--color-text)" }}>Skeleton</span>
              <span style={{ color: "var(--color-primary)" }}>.app</span>
            </span>
          </div>

          <h1
            className="text-xl font-semibold mb-1"
            style={{ color: "var(--color-text)" }}
          >
            Iniciar sesión
          </h1>
          <p
            className="text-sm mb-8"
            style={{ color: "var(--color-text-muted)" }}
          >
            Ingresa tus credenciales para continuar.
          </p>

          <LoginForm />
        </div>
      </section>
    </main>
  )
}