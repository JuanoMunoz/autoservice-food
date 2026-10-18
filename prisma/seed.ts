import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/prisma"

const INVENTORY_LOCATIONS = [
    { code: "caba", name: "CABA" },
    { code: "puesto", name: "PUESTO" },
]

async function seedAdmin() {
    const email = process.env.SEED_ADMIN_EMAIL
    const password = process.env.SEED_ADMIN_PASSWORD
    const name = process.env.SEED_ADMIN_NAME

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
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message.toLowerCase() : ""
        const status = (err as { status?: number } | null)?.status
        if (message.includes("already exists") || status === 422) {
            console.log(`El usuario admin (${email}) ya existe, se omite el seed.`)
            return
        }
        throw err
    }
}

/** Crea las 2 ubicaciones de inventario y una fila de stock (en 0) por ingrediente. Idempotente. */
async function seedInventory() {
    const locations = await Promise.all(
        INVENTORY_LOCATIONS.map((loc) =>
            prisma.stockLocation.upsert({
                where: { code: loc.code },
                update: { name: loc.name },
                create: { code: loc.code, name: loc.name },
            })
        )
    )
    console.log(`Ubicaciones de inventario listas: ${locations.map((l) => l.name).join(", ")}`)

    const ingredients = await prisma.ingredients.findMany({ select: { id: true } })
    if (ingredients.length === 0) {
        console.log("No hay ingredientes para inicializar stock.")
        return
    }

    let created = 0
    for (const ingredient of ingredients) {
        for (const location of locations) {
            const existing = await prisma.ingredientStock.findUnique({
                where: {
                    ingredientId_locationId: {
                        ingredientId: ingredient.id,
                        locationId: location.id,
                    },
                },
                select: { id: true },
            })
            if (existing) continue

            await prisma.ingredientStock.create({
                data: { ingredientId: ingredient.id, locationId: location.id, quantity: 0, minQuantity: 0 },
            })
            created++
        }
    }
    console.log(`Filas de stock inicializadas: ${created}`)
}

async function main() {
    if (process.env.NODE_ENV === "production" && process.env.SEED_ALLOW_PRODUCTION !== "true") {
        console.log("Seed de admin omitido: NODE_ENV=production sin SEED_ALLOW_PRODUCTION=true")
    } else {
        await seedAdmin()
    }

    await seedInventory()
}

main()
    .catch((e) => {
        console.error(" Error al correr el seed:", e)
        process.exit(1)
    })
    .then(() => {
        process.exit(0)
    })