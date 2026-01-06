/**
 * Check if a route is public (accessible without authentication)
 */
export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = ['/privacy', '/terms']
  return publicRoutes.includes(pathname)
}
