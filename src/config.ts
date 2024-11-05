/* eslint-disable @typescript-eslint/no-unused-vars */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  onAuthStateChanged,
} from "firebase/auth";
import { getDatabase, ref, push, update, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_DATABASE_URL,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export {
  app,
  auth,
  provider,
  signInWithPopup,
  signInWithRedirect,
  onAuthStateChanged,
  database,
  ref,
  push,
  update,
  remove,
};
