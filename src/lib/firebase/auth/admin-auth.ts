import { getAuth } from "firebase-admin/auth";
import { initializeFirebaseAdmin } from "../sdk/admin-sdk";

const app = initializeFirebaseAdmin();
const adminAuth = getAuth(app);

export { adminAuth };
