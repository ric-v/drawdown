export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout is nested inside the root layout
  // Just pass through the children
  return <>{children}</>
}
