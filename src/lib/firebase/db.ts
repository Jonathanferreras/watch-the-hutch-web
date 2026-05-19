import { getFirestore } from "firebase-admin/firestore";
import { initializeFirebaseAdmin } from "./sdk/admin-sdk";

const app = initializeFirebaseAdmin();
const db = getFirestore(app);

export { db };
