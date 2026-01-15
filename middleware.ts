import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simple middleware - just pass through all requests
// Authentication is handled by route group layouts
export default function middleware(req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (auth routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
}
