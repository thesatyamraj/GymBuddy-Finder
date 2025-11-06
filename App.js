// App.js
import React, { useEffect, useState } from "react";
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

  // 🔐 Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);

          // ✅ Check if Firestore profile exists
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          setHasProfile(userDoc.exists());
        } else {
          setUser(null);
          setHasProfile(false);
        }
      } catch (error) {
        console.error("Error verifying user profile:", error);
        setHasProfile(false);
      } finally {
        setInitializing(false);
      }
    });

    return unsubscribe;
  }, []);

  // ⏳ Loading screen while checking auth
  if (initializing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // 🧭 Main navigation entry
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
