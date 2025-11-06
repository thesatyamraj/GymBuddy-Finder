// firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 🔐 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD69glR4JaeKnUXLQhk83ctLCtJOd2aikE",
  authDomain: "gymbuddyfinder-bb1ee.firebaseapp.com",
  projectId: "gymbuddyfinder-bb1ee",
  storageBucket: "gymbuddyfinder-bb1ee.appspot.com",
  messagingSenderId: "880219662337",
  appId: "1:880219662337:web:b03344d780c7840ff63800",
};

// 🚀 Initialize app only once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Initialize Auth with persistence for React Native
import { getAuth } from "firebase/auth";
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (e) {
  // If already initialized (Fast Refresh), fallback to existing instance
  auth = getAuth(app);
}

// ✅ Firestore & Storage
const db = getFirestore(app);
const storage = getStorage(app);

// ✅ Export all
export { app, auth, db, storage };
