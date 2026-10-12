import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Services are created lazily so importing this module (e.g. while Next.js
// prerenders pages at build time) never requires Firebase to be configured.
function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const getAuthClient = () => getAuth(getFirebaseApp());
export const getDb = () => getFirestore(getFirebaseApp());
export const getStorageClient = () => getStorage(getFirebaseApp());

export const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "")
  .trim()
  .toLowerCase();
