import type { Metadata, Viewport } from "next"
import { Galindo, Archivo, Saira_Extra_Condensed } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"
import { CartProvider } from "@/lib/cart-context"

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"]
})

const saira = Saira_Extra_Condensed({
  variable: "--font-saira",
  subsets: ["latin"],
  weight: ["900", "700", "800"]
})

const galindo = Galindo({
  variable: "--font-galindo",
  subsets: ["latin"],
  weight: "400",
})

export const metadata: Metadata = {
  title: "CheesePapas — Autoservicio de comida rápida",
  description: "CheesePapas Autoservicio de comida rápida. Realiza tu pedido a domicilio.",
  icons: {
    icon: '/logo-cheesepapas.webp',
    shortcut: '/logo-cheesepapas.webp',
    apple: '/logo-cheesepapas.webp',
  },
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${galindo.variable} ${saira.variable} ${archivo.variable} scroll-smooth h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        <CartProvider>
          {children}
        </CartProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#ffffff",
              color: "#0f172a",
              border: "1px solid #e2e8f0",
              borderRadius: "0px",
              fontSize: "0.875rem",
            },
          }}
        />
      </body>
    </html>
  )
}
