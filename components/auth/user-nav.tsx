
"use client"

import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { SignOutButton } from "./sign-out-button"

export function UserNav() {
    const { data: session } = useSession()

    if (!session?.user) return null

    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                    <AvatarFallback>{session.user.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col">
                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                </div>
            </div>
            <SignOutButton />
        </div>
    )
}
