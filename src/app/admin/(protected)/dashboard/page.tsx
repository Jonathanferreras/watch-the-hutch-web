"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/src/features/auth/hooks/use-auth";
import { BridgeStatusCard } from "@/src/features/bridge-state/components/bridge-status-card";
import { BridgeStateEditor } from "@/src/features/bridge-state/components/bridge-state-editor/bridge-state-editor";
import { BridgeDataSourceToggle } from "@/src/features/bridge-state/components/bridge-data-source-toggle";

export default function AdminDashboard() {
  const router = useRouter();
  const { error, loading, logout } = useAuth();

  const handleLogout = async () => {
    const loggedOut = await logout();

    if (!loggedOut) {
      return;
    }

    router.push("/admin/login");
  };

  return (
    <div className="p-4 pb-4 pt-20">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Admin Dashboard</h3>
        </div>

        <button
          className="rounded border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          onClick={handleLogout}
        >
          {loading ? "Logging out..." : "Logout"}
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error.message}</p> : null}
      <div style={{ maxWidth: "768px" }}>
        <BridgeDataSourceToggle />
        <br />
        <BridgeStatusCard />
        <br />
        <BridgeStateEditor />
        <br />
      </div>
    </div>
  );
}
