import { getFirestore } from "firebase/firestore";

import { initializeFirebaseClient } from "./sdk";

const app = initializeFirebaseClient();
const db = getFirestore(app);

export { db };
