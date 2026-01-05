"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function SignOutButton() {
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-500/10 dark:to-red-500/10 hover:from-rose-100 hover:to-red-100 dark:hover:from-rose-500/20 dark:hover:to-red-500/20 border border-rose-200/50 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95"
            title="Sign Out"
        >
            <LogOut className="h-4 w-4 md:h-5 md:h-5" />
        </Button>
    )
}
