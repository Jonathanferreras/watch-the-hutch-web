import { useState } from "react";

import { authClient } from "../auth.service";
import { AuthCredentials } from "../auth.types";
import { toError } from "@/src/lib/errors";

export const useAuth = () => {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const login = async (
    credentials: AuthCredentials
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await authClient.login(credentials);

      setSuccess(true);
      return true;
    } catch (error) {
      setError(toError(error, "Unknown login error."));
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

      return true;
    } catch (error) {
      setError(toError(error, "Unknown logout error."));
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
