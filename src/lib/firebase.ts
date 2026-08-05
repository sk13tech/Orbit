import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export const isFirebaseConfigured =
  !!firebaseConfig.apiKey && !!firebaseConfig.projectId && !!firebaseConfig.appId;

const app = isFirebaseConfigured
  ? getApps().length ? getApp() : initializeApp(firebaseConfig)
  : null;

export const auth = app ? getAuth(app) : null;
if (auth) setPersistence(auth, browserLocalPersistence).catch(() => {});

const _db = app ? getFirestore(app) : null;

/** Get Firestore instance — throws if Firebase is not configured */
export function getDb() {
  if (!_db) throw new Error("Firebase not configured");
  return _db;
}

// For backward compat — use getDb() in firestore.ts
export const db = _db;
export const googleProvider = new GoogleAuthProvider();
