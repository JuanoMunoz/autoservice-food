import { checkSession } from "@/utils/auth"
import LoginForm from "./_components/login-form"
import { redirect } from "next/navigation"
import Image from "next/image"

export const metadata = {
  title: "Iniciar Sesión | CheesePapas Admin",
  description: "Accede al panel de administración y cocina de CheesePapas.",
}

export default async function LoginPage() {
  const session = await checkSession()
  if (session) redirect("/dashboard")

  return (
    <main className="flex min-h-dvh bg-white text-slate-900 font-sans">
      {/* Panel izquierdo — Branding & Logo */}
      <aside className="hidden lg:flex flex-col justify-between w-96 shrink-0 p-10 bg-slate-50 border-r border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/logo-cheesepapas.webp"
              alt="CheesePapas Logo"
              width={56}
              height={56}
              className="rounded-none object-cover shadow-sm border border-slate-200"
            />
            <span className="text-2xl font-saira font-extrabold text-slate-900 tracking-wide">
              Cheese<span className="text-secondary">Papas</span>
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-3xl font-black leading-tight text-slate-900">
            Gestión de Pedidos & Cocina.{' '}
            <span className="text-secondary block">Sin fricción.</span>
          </p>
        </div>

        <p className="text-xs text-slate-400 font-medium">
          © {new Date().getFullYear()} <span className="font-saira font-extrabold">Cheese<span className="text-secondary">Papas</span></span>. Todos los derechos reservados.
        </p>
      </aside>

      {/* Panel derecho — Formulario */}
      <section className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm space-y-6 bg-white border border-slate-200 p-8 rounded-none shadow-sm">
          {/* Header Mobile / Brand Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            <Image
              src="/logo-cheesepapas.webp"
              alt="CheesePapas Logo"
              width={72}
              height={76}
              className="rounded-none object-cover shadow-sm border border-slate-200"
            />
            <div className="space-y-1">
              <h1 className="text-2xl font-saira font-extrabold text-slate-900 tracking-tight">
                Cheese<span className="text-secondary">Papas</span> Admin
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Ingresa tus credenciales de administración.
              </p>
            </div>
          </div>

          <LoginForm />
        </div>
      </section>
    </main>
  )
}