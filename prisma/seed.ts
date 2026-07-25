import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/prisma"
async function main() {
    const email = process.env.SEED_ADMIN_EMAIL
    const password = process.env.SEED_ADMIN_PASSWORD
    const name = process.env.SEED_ADMIN_NAME

    if (process.env.NODE_ENV === "production" && process.env.SEED_ALLOW_PRODUCTION !== "true") {
        console.log("Seed omitido: NODE_ENV=production sin SEED_ALLOW_PRODUCTION=true")
        return
    }
    if (!email || !password || !name) {
        console.log("No se encontraron los datos del usuario bases")
        return
    }

    try {
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            console.log(`El usuario admin (${email}) ya existe, se omite el seed.`)
            return
        }
    } catch {
    }

    try {
        await auth.api.signUpEmail({
            body: {
                email,
                password,
                name,
            },
        })

        console.log(`Usuario admin creado: ${email}`)
        console.log("   Recuerda cambiar la contraseña por defecto.")
    } catch (err: any) {
        if (err?.message?.toLowerCase?.().includes("already exists") || err?.status === 422) {
            console.log(`El usuario admin (${email}) ya existe, se omite el seed.`)
            return
        }
        throw err
    }
}

main()
    .catch((e) => {
        console.error(" Error al correr el seed:", e)
        process.exit(1)
    })
    .then(() => {
        process.exit(0)
    })