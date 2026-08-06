import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = !!(cfg.apiKey && cfg.projectId && cfg.appId);

const app = isFirebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(cfg))
  : null;

export const auth = app ? getAuth(app) : null;
export const authReady = auth
  ? setPersistence(auth, browserLocalPersistence)
      .then(() => auth)
      .catch(() => auth)
  : Promise.resolve(null);

export const googleProvider = auth ? new GoogleAuthProvider() : null;
if (googleProvider) {
  googleProvider.setCustomParameters({ prompt: "select_account" });
}

const _db = app ? getFirestore(app) : null;
export function getDb() {
  if (!_db) throw new Error("Firebase not configured");
  return _db;
}
export const db = _db;
