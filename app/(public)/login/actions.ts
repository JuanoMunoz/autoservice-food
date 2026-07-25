'use server'
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
export async function loginAction(form: FormData) {
    const email = form.get("email") as string
    const password = form.get("password") as string
    try {

        await auth.api.signInEmail({
            body: {
                email,
                password
            }
        })
    } catch (error) {
        return { error: "Invalid email or password" };
    }
    redirect("/dashboard")
}