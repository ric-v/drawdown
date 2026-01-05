
"use server"

import { signIn, signOut } from "@/config/auth"

export async function signInAction(provider: string) {
    await signIn(provider)
}

export async function signOutAction() {
    await signOut({ redirectTo: "/" })
}
