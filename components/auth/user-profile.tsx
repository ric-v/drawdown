
import { auth } from "@/auth"
import { SignOutButton } from "./sign-out-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export async function UserProfile() {
    const session = await auth()

    if (!session?.user) return null

    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <Avatar>
                    <AvatarImage src={session.user.image || ""} />
                    <AvatarFallback>{session.user.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                </div>
            </div>
            <SignOutButton />
        </div>
    )
}
