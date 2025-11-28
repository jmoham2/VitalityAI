import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Helper to check if config is valid
const isConfigValid =
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "your_firebase_api_key_here" &&
  !firebaseConfig.apiKey.includes("mock_key");

let app;
let auth: any;
let db: any;

if (isConfigValid) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase initialization error:", e);
  }
} else {
  console.warn(
    "Firebase config is missing or invalid in .env.local. Firebase features will not work."
  );
  // Provide mock objects so imports don't crash, but usage will fail gracefully or throw
  auth = {};
  db = {};
}

export { auth, db };
