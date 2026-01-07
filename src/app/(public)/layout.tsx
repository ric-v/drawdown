import { Footer } from "@/components/layout/footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col">
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  )
}
