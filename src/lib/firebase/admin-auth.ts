import { getAuth } from "firebase-admin/auth";
import { initializeFirebaseAdmin } from "./app";

const app = initializeFirebaseAdmin();
const adminAuth = getAuth(app);

export { adminAuth };
