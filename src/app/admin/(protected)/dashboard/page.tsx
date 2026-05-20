"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/src/features/auth/hooks/use-auth";

export default function AdminDashboard() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };
  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Admin Dashboard</h3>
        </div>
        <button className="rounded border px-3 py-2" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
