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
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  // 🧑‍💻 Load current user's profile for avatar
  useEffect(() => {
    const loadMe = async () => {
      try {
        if (!currentUser) return;
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) setMe(snap.data());
      } catch (e) {
        console.error("Error loading current user:", e);
      }
    };
    loadMe();
  }, [currentUser]);

  // 🧩 Real-time listener for user's matches
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, "matches"), where("users", "array-contains", currentUser.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedMatches = [];

      for (const docSnap of snapshot.docs) {
        const match = docSnap.data();
        const otherUserId = match.users.find((id) => id !== currentUser.uid);
        if (!otherUserId) continue;

        try {
          const userRef = doc(db, "users", otherUserId);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            fetchedMatches.push({ id: userDoc.id, ...userDoc.data() });
          }
        } catch (error) {
          console.error("Error loading match:", error);
        }
      }

      setMatches(fetchedMatches);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Helper: initials for fallback avatar
  const initials = (me?.name || "")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
          onPress={() => navigation.navigate("Swipes")}
        >
          <Text style={styles.backText}>Back to Swipes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ✅ Main UI
  return (
    <View style={styles.container}>
      {/* Header with profile avatar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Profile")}
          activeOpacity={0.8}
          style={styles.meButton}
        >
          {me?.photoURL ? (
            <Image source={{ uri: me.photoURL }} style={styles.meAvatar} />
          ) : (
            <View style={[styles.meAvatar, styles.meFallback]}>
              <Text style={styles.meInitials}>{initials || "U"}</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.headerTitle}>❤️ Your Matches</Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Chats")}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
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
              {item.workoutType && (
                <Text style={styles.bio}>Workout: {item.workoutType}</Text>
              )}
              {item.gymName && <Text style={styles.bio}>Gym: {item.gymName}</Text>}
            </View>
            <Ionicons name="chevron-forward-outline" size={22} color="#ccc" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// 💅 Styles
const AVATAR_SIZE = 36;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    paddingTop: 60,
    paddingHorizontal: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF",
  },
  meButton: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  meAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  meFallback: {
    backgroundColor: "#DDE8FF",
    borderWidth: 1,
    borderColor: "#B7CEFF",
  },
  meInitials: { color: "#2F6BFF", fontWeight: "700" },
  iconButton: {
    padding: 6,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
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
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
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
