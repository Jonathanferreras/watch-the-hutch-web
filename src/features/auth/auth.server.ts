import "server-only";

import { cookies } from "next/headers";
import { adminAuth } from "@/src/lib/firebase/auth/admin-auth";
import { DecodedIdToken } from "firebase-admin/auth";

const SESSION_COOKIE_NAME = "session";

const getAdminUser = async (): Promise<DecodedIdToken | null> => {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return await adminAuth.verifyIdToken(token);
  } catch {
    return null;
  }
};

export { getAdminUser };
