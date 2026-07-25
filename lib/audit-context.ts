import { AsyncLocalStorage } from "node:async_hooks"

type AuditCtx = {
    userId: string | null
    ip?: string
    userAgent?: string
}

export const auditContext = new AsyncLocalStorage<AuditCtx>()

export function withAuditContext<T>(ctx: AuditCtx, fn: () => Promise<T>): Promise<T> {
    return auditContext.run(ctx, fn)
}

/** Obtiene el userId del contexto actual, o null si no hay contexto */
export function getAuditUserId(): string | null {
    return auditContext.getStore()?.userId ?? null
}
