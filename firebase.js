// firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyD69glR4JaeKnUXLQhk83ctLCtJOd2aikE",
  authDomain: "gymbuddyfinder-bb1ee.firebaseapp.com",
  projectId: "gymbuddyfinder-bb1ee",
  storageBucket: "gymbuddyfinder-bb1ee.appspot.com",
  messagingSenderId: "880219662337",
  appId: "1:880219662337:web:b03344d780c7840ff63800",
};

// Initialize app once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// --- Auth (RN gets AsyncStorage persistence; web uses default) ---
let auth;
if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // If already initialized (Fast Refresh), reuse existing instance
    auth = getAuth(app);
  }
}

// --- Firestore (long polling improves reliability on Expo Go / emulators) ---
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

// --- Storage ---
const storage = getStorage(app);

export { app, auth, db, storage };
