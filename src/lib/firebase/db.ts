import { getFirestore } from "firebase-admin/firestore";
import { initializeFirebaseAdmin } from "./app";

const app = initializeFirebaseAdmin();
const db = getFirestore(app);

export { db };
