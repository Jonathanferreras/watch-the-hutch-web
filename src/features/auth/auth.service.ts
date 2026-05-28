import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";

import { auth } from "@/src/lib/firebase/auth";
import { logError } from "@/src/lib/errors";

export type AuthUser = User;

const login = async (
  credentials: any,
) => {
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
    logError("Auth Service", "Failed to authenticate user.", error);
    throw error;
  }
};

const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    logError("Auth Service", "Failed to sign out user.", error);
    throw error;
  }
};

const subscribeToAuthState = (callback: (user: User | null) => void) => onAuthStateChanged(auth, callback)

export const authClient = {
  login,
  logout,
  subscribeToAuthState
};
