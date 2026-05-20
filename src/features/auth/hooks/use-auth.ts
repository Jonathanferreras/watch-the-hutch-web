import { useState } from "react";

import authClient from "@/src/features/auth/auth.client";
import {
  endAuthSession,
  setAuthSession,
} from "@/src/features/auth/auth.queries";
import { AuthCredentialsSchema } from "@/src/features/auth/auth.schemas";

export const useAuth = () => {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const login = async (
    credentials: AuthCredentialsSchema,
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const token = await authClient.login(credentials);

      if (!token) {
        throw new Error("Failed to authenticate user.");
      }

      const sessionCreated = await setAuthSession(token);

      if (!sessionCreated) {
        throw new Error("Failed to set auth session.");
      }

      setSuccess(true);
      return true;
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Unknown login error.");

      setError(normalizedError);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await authClient.logout();

      const sessionEnded = await endAuthSession();

      if (!sessionEnded) {
        throw new Error("Failed to end auth session.");
      }

      return true;
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Unknown logout error.");

      setError(normalizedError);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    logout,
    success,
    loading,
    error,
  };
};
