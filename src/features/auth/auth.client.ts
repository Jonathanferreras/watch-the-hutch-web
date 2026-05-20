import { signInWithEmailAndPassword, signOut } from "firebase/auth";

import { auth } from "@/src/lib/firebase/auth/client-auth";
import {
  AuthCredentialsSchema,
  AuthSessionPayloadSchema,
} from "./auth.schemas";

const logError = (message: string, error: unknown) => {
  console.error(`[AuthService] ${message}`, error);
};

const login = async (
  credentials: AuthCredentialsSchema,
): Promise<AuthSessionPayloadSchema> => {
  try {
    const { email, password } = credentials;

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    if (!userCredential) {
      throw new Error("Failed to sign user in.");
    }

    const token = await userCredential.user.getIdToken();

    if (!token) {
      throw new Error("Failed to get auth token.");
    }

    return { token };
  } catch (error) {
    logError("Failed to authenticate user.", error);
    throw error;
  }
};

const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    logError("Failed to sign out user.", error);
    throw error;
  }
};

const authClient = {
  login,
  logout,
};

export default authClient;
