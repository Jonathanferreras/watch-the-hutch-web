// app/admin/(protected)/layout.tsx
import { redirect } from "next/navigation";

import { getAdminUser } from "@/src/features/auth/auth.server";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await getAdminUser();

  if (!user) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
