import type { Metadata, Viewport } from "next"
import { Galindo, Archivo } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"


const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"]
})
const galindo = Galindo({
  variable: "--font-galindo",
  subsets: ["latin"],
  weight: "400",
})

export const metadata: Metadata = {
  title: "Skeleton",
  description: "Tu descripción aquí.",
}

export const viewport: Viewport = {
  themeColor: "#125AF5",
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
      className={`${galindo.variable} ${archivo.variable} scroll-smooth  h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--color-surface)",
              color: "var(--color-text)",
              border: "1px solid var(--color-border)",
              borderLeft: "2px solid var(--color-primary)",
              borderRadius: "4px",
              fontSize: "0.875rem",
            },
          }}
        />
      </body>
    </html>
  )
}
