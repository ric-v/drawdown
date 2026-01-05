import { auth } from "./auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default auth((req: NextRequest) => {
  // This runs only for authenticated users
  // For unauthenticated users, auth middleware will redirect to login
  return NextResponse.next()
})

// Protect routes that require authentication
export const config = {
  matcher: [
    // Protected routes
    "/((?!_next|public|api/auth|favicon.ico|terms|privacy).*)",
  ],
}
