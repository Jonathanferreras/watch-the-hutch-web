"use client";

import { SyntheticEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/src/features/auth/hooks/use-auth";
import { errorMessage } from "@/src/lib/errors";

export default function AdminLogin() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState("");

  const { login, loading } = useAuth();

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");

    try {
      const success = await login({
        email: username,
        password,
      });

      if (!success) {
        throw new Error("Unable to login.");
      }

      router.push("/admin/dashboard");
    } catch (error) {
      setSubmitError(errorMessage(error, "Unable to login."));
    }
  };

  return (
    <div className="p-4">
      <h3 className="mb-4 text-lg font-semibold">Admin Login</h3>

      <form className="flex max-w-sm flex-col gap-3" onSubmit={handleSubmit}>
        <input
          className="rounded border px-3 py-2"
          name="username"
          placeholder="Email"
          type="email"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />

        <input
          className="rounded border px-3 py-2"
          name="password"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button
          className="rounded border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {submitError ? (
          <p className="text-sm text-red-600">{submitError}</p>
        ) : null}
      </form>
    </div>
  );
}
