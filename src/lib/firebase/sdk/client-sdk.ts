import {
  initializeApp as initializeAppClient,
  getApps as getAppsClient,
  getApp as getAppClient,
} from "firebase/app";

const initializeFirebaseClient = () => {
  if (getAppsClient().length > 0) {
    return getAppClient();
  }

  return initializeAppClient({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
};

export { initializeFirebaseClient };
