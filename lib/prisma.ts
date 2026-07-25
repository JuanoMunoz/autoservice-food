import { PrismaClient } from "@/lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { auditContext } from "./audit-context"

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof buildPrismaClient> | undefined
}

const AUDIT_FIELDS: Record<string, string[]> = {
    // modelName : ["campoARellenar",...]
}

function buildPrismaClient() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
    const base = new PrismaClient({ adapter })

    return base.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const modelName = model ? model.charAt(0).toLowerCase() + model.slice(1) : "";
                    const fields = AUDIT_FIELDS[modelName];

                    if (!model || !fields) {
                        return query(args)
                    }

                    const ctx = auditContext.getStore()
                    const userId = ctx?.userId ?? null
                    const ip = ctx?.ip
                    const userAgent = ctx?.userAgent

                    // ── Operaciones de escritura — inyectar actores ──────────────
                    if (operation === "create") {
                        const data = (args as any).data
                        if (userId && data) {
                            if (fields.includes("createdById")) data.createdById = userId
                            if (fields.includes("updatedById")) data.updatedById = userId
                        }
                    }

                    if (operation === "update" || operation === "upsert") {
                        const data = (args as any).data
                        if (userId && data) {
                            if (fields.includes("updatedById")) data.updatedById = userId
                        }
                    }

                    let before: Record<string, unknown> | null = null

                    if ((operation === "update" || operation === "delete") && (args as any).where?.id) {
                        try {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            before = await (base as any)[model.charAt(0).toLowerCase() + model.slice(1)].findUnique({
                                where: { id: (args as any).where.id },
                            })
                        } catch {
                            // lectura previa es best-effort
                        }
                    }


                    const result = await query(args)


                    const auditActionMap: Record<string, "CREATE" | "UPDATE" | "DELETE"> = {
                        create: "CREATE",
                        createMany: "CREATE",
                        update: "UPDATE",
                        updateMany: "UPDATE",
                        upsert: "UPDATE",
                        delete: "DELETE",
                        deleteMany: "DELETE",
                    }

                    const auditAction = auditActionMap[operation]
                    if (!auditAction) return result

                    const entityId =
                        (result as any)?.id ??
                        (args as any)?.where?.id ??
                        "batch"

                    // ── Escribir en AuditLog  ──
                    base.auditLog.create({
                        data: {
                            action: auditAction,
                            entity: model,
                            entityId: String(entityId),
                            userId: userId ?? undefined,
                            before: (before as any) ?? undefined,
                            after: auditAction !== "DELETE" ? (result as any) ?? undefined : undefined,
                            ipAddress: ip,
                            userAgent,
                        },
                    }).catch(() => { console.log("Error during operation") })

                    return result
                },
            },
        },
    })
}

export const prisma = globalForPrisma.prisma ?? buildPrismaClient()

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma
}