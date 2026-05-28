import { getAuth } from "firebase/auth";

import { initializeFirebaseClient } from "./sdk";

const app = initializeFirebaseClient();
const auth = getAuth(app);

export { auth };
