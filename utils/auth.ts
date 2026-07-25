// lib/utils/auth.ts
"use server";

import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/types/User";
import { withAuditContext } from "@/lib/audit-context";


export async function checkSession() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return session;
}


export async function requireSession() {
    const session = await checkSession();

    if (!session) {
        redirect("/login");
    }

    return session;
}

export async function requireRole(allowedRoles: Role[]) {
    const session = await requireSession();
    const role = session.user.role as Role;

    if (!allowedRoles.includes(role)) {
        redirect("/dashboard/unauthorized");
    }

    return session;
}
export async function checkIsSuperAdmin() {
    const session = await checkSession();

    if (!session) return false;

    return (session.user.role as Role) === "SUPER_ADMIN";
}


export async function requireSuperAdmin() {
    const session = await requireSession();

    if ((session.user.role as Role) !== "SUPER_ADMIN") {
        throw new Error("No tienes permiso para realizar esta acción");
    }

    return session;
}


export async function runWithAuditContext<T>(fn: () => Promise<T>): Promise<T> {
    const [session, hdrs] = await Promise.all([checkSession(), headers()])
    const userId = session?.user?.id ?? null
    const ip = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? undefined
    const userAgent = hdrs.get("user-agent") ?? undefined

    return withAuditContext({ userId, ip, userAgent }, fn)
}