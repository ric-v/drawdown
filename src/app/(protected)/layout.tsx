import { auth } from "@/config/auth";
import { LoginScreen } from "@/components/auth/login-screen";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();

  // If not authenticated, show login screen
  if (!session) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
