// App.js
import React, { useEffect, useState, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "./firebase";
import AppNavigator from "./navigation/AppNavigator";

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);

  // Keep a mounted flag to avoid setting state after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 🔐 Listen to Firebase Auth state and check profile existence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!mountedRef.current) return;

        if (firebaseUser) {
          setUser(firebaseUser);
          try {
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            if (!mountedRef.current) return;
            setHasProfile(userDoc.exists());
          } catch (e) {
            console.error("Error checking Firestore profile:", e);
            if (mountedRef.current) setHasProfile(false);
          }
        } else {
          setUser(null);
          setHasProfile(false);
        }
      } finally {
        if (mountedRef.current) setInitializing(false);
      }
    });

    return unsubscribe;
  }, []);

  // ⏳ Splash while we verify auth/profile
  if (initializing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // 🧭 Main navigation
  return (
    <NavigationContainer>
      <AppNavigator user={user} hasProfile={hasProfile} />
    </NavigationContainer>
  );
}

const styles = {
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
};
