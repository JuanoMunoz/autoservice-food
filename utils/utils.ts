import { Role } from "@/types/User"

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ")
}


export function formatDate(dateStr: string): string {
  const normalized = dateStr.includes("T") ? dateStr : dateStr + "T00:00:00"
  const date = new Date(normalized)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}


export function relativeDate(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr + "T00:00:00")
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Hoy"
  if (diffDays === 1) return "Mañana"
  if (diffDays === -1) return "Ayer"
  if (diffDays > 0) return `En ${diffDays} días`
  return `Hace ${Math.abs(diffDays)} días`
}

export function generatePassword(length = 12): string {
  const chars =
    "abcdefghijkmnopqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}


//Estos son ejemplos
export function parseRoleAsName(role: Role) {
  if (role == "SUPER_ADMIN") return "Súper Administrador"
  else if (role == "ADMIN") return "Administrador"
  else if (role == "USER") return "Usuario"
}


export function deriveEmail(
  firstName: string,
  lastName: string,
  domain = "yourdomain.com"
): string {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, ".")
  return `${clean(firstName)}.${clean(lastName)}@${domain}`
}
