import { getAuth } from "firebase/auth";
import { initializeFirebaseClient } from "../sdk/client-sdk";

const app = initializeFirebaseClient();
const auth = getAuth(app);

export { auth };
