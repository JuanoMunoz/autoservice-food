import { Role } from "@/types/User"
import type { ImageSource } from "@imgly/background-removal"

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

// ─── COP Currency ────────────────────────────────────────────────────────────

/**
 * Formats a numeric value as Colombian Peso (COP).
 * e.g. 12000 → "$ 12.000"
 */
export function formatCOP(value: number | string | { toNumber?: () => number }): string {
  let num: number
  if (typeof value === "object" && value !== null && typeof (value as { toNumber?: () => number }).toNumber === "function") {
    num = (value as { toNumber: () => number }).toNumber()
  } else {
    num = Number(value)
  }
  if (isNaN(num)) return "$ 0"
  return "$ " + num.toLocaleString("es-CO", { maximumFractionDigits: 0 })
}


export function parseCOP(value: string): number {
  const cleaned = value.replace(/[^0-9]/g, "")
  return cleaned === "" ? 0 : parseInt(cleaned, 10)
}


export async function removeImageBackground(file: File): Promise<File> {
  const { removeBackground } = await import("@imgly/background-removal")
  const blob = await removeBackground(file as unknown as ImageSource)
  return new File([blob], file.name.replace(/\.[^.]+$/, ".png"), { type: "image/png" })
}

export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        } else {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        resolve(file)
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      const outputType = file.type || "image/png"
      const ext = ".png"
      const outputName = file.name.replace(/\.[^.]+$/, ext)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }

          if (blob.size >= file.size) {
            resolve(file)
            return
          }
          resolve(new File([blob], outputName, { type: outputType }))
        },
        outputType,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}

