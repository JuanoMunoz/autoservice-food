"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldAlert, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function UnauthorizedPage() {
  const router = useRouter()
  const [secondsLeft, setSecondsLeft] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push("/event")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <ShieldAlert size={24} strokeWidth={1.5} />
      </div>
      <h1 className="text-xl font-bold mb-2 text-slate-100">
        Acceso no autorizado
      </h1>
      <p className="text-sm mb-6 text-slate-400">
        No tienes permisos suficientes para acceder a esta sección del panel de administración.
      </p>

      <div className="flex flex-col items-center gap-4 w-full">
        <p className="text-xs font-medium text-amber-400">
          Redirigiendo a login en {secondsLeft} segundos...
        </p>

        <Link
          href="/event"
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-700 transition-colors text-slate-200 hover:bg-slate-800 min-h-11"
        >
          Ir ahora
          <ArrowRight size={12} strokeWidth={2} />
        </Link>
      </div>
    </div>
  )
}
