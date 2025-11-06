// screens/MatchesScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Ionicons } from "@expo/vector-icons";

export default function MatchesScreen({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  // 🧩 Real-time listener for user's matches
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, "matches"), where("users", "array-contains", currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const fetched = [];
        for (const docSnap of snapshot.docs) {
          const match = docSnap.data();
          const otherUserId = (match.users || []).find((id) => id !== currentUser.uid);
          if (!otherUserId) continue;

          try {
            const userRef = doc(db, "users", otherUserId);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              fetched.push({ id: userDoc.id, ...userDoc.data() });
            }
          } catch (error) {
            console.error("Error loading match:", error);
          }
        }
        setMatches(fetched);
        setLoading(false);
      },
      (err) => {
        console.error("Matches listener error:", err);
        Alert.alert("Error", "Unable to load your matches.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  // 🌀 Loading view
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Loading your matches...</Text>
      </View>
    );
  }

  // ❌ No matches yet
  if (matches.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="people-outline" size={60} color="#ccc" />
        <Text style={styles.noMatchText}>No matches yet — keep swiping 💪</Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.getParent()?.navigate("Swipes")}
        >
          <Text style={styles.backText}>Back to Swipes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ✅ Main list
  return (
    <View style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.matchItem}
            onPress={() => navigation.navigate("Chat", { matchUser: item })}
          >
            <Image
              source={{
                uri:
                  item.photoURL ||
                  item.image ||
                  item.profileImage ||
                  "https://via.placeholder.com/150x150.png?text=No+Photo",
              }}
              style={styles.avatar}
            />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name || "Gym Buddy"}</Text>
              {item.workoutType ? (
                <Text style={styles.bio}>Workout: {item.workoutType}</Text>
              ) : null}
              {item.gymName ? <Text style={styles.bio}>Gym: {item.gymName}</Text> : null}
            </View>
            <Ionicons name="chevron-forward-outline" size={22} color="#ccc" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// 💅 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    paddingTop: 10,       // header is handled by the stack, so no extra top padding
    paddingHorizontal: 10,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  noMatchText: {
    fontSize: 18,
    color: "#777",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  matchItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 18, fontWeight: "bold", color: "#333" },
  bio: { fontSize: 14, color: "#666" },
  backButton: {
    marginTop: 15,
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backText: { color: "#fff", fontWeight: "bold" },
});
