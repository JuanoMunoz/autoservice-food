import { prismaAdapter } from "@better-auth/prisma-adapter";

import { betterAuth } from "better-auth";
import { prisma } from "@/lib/prisma"
import { PrismaPg } from "@prisma/adapter-pg";
import { nextCookies } from "better-auth/next-js";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql"
    }),
    user: {
        additionalFields: {
            role: {
                type: ["SUPER_ADMIN", "ADMIN", "USER"],
                required: true,
                defaultValue: "USER",
                input: false
            }
        }
    },
    experimental: { joins: true },
    emailAndPassword: { enabled: true, autoSignIn: false },
    plugins: [
        nextCookies()
    ]
})