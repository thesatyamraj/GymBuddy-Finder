// screens/SwipeScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  addDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { Ionicons } from "@expo/vector-icons";

export default function SwipeScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null); // current user's profile (for avatar)
  const [loading, setLoading] = useState(true);
  const shownMatchesRef = useRef(new Set()); // prevent duplicate alerts
  const currentUser = auth.currentUser;

  // If not authenticated, send to Auth
  useEffect(() => {
    if (!currentUser) {
      navigation.reset({ index: 0, routes: [{ name: "Auth" }] });
    }
  }, [currentUser, navigation]);

  // Load my profile (for header avatar)
  useEffect(() => {
    let alive = true;
    const loadMe = async () => {
      try {
        if (!currentUser) return;
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (alive) setMe(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } catch (e) {
        console.log("Error loading my profile:", e);
      }
    };
    loadMe();
    return () => {
      alive = false;
    };
  }, [currentUser?.uid]);

  // Fetch users excluding current user
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!currentUser) return;
        const querySnapshot = await getDocs(collection(db, "users"));
        const allUsers = [];
        querySnapshot.forEach((docSnap) => {
          if (docSnap.id !== currentUser.uid) {
            allUsers.push({ id: docSnap.id, ...docSnap.data() });
          }
        });
        setUsers(allUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        Alert.alert("Error", "Unable to fetch users. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [currentUser]);

  // Real-time match listener
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "matches"),
      where("users", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type !== "added") continue;

        const matchId = change.doc.id;
        if (shownMatchesRef.current.has(matchId)) continue;
        shownMatchesRef.current.add(matchId);

        const matchData = change.doc.data();
        const otherUserId = (matchData.users || []).find(
          (id) => id !== currentUser.uid
        );
        if (!otherUserId) continue;

        const otherUserDoc = await getDoc(doc(db, "users", otherUserId));
        if (otherUserDoc.exists()) {
          const otherUser = otherUserDoc.data();
          Alert.alert(
            "🎉 It's a Match!",
            `You matched with ${otherUser.name || "a gym buddy"} 💪`,
            [
              { text: "View Matches", onPress: () => navigation.navigate("Matches") },
              { text: "OK", style: "cancel" },
            ]
          );
        }
      }
    });

    return unsubscribe;
  }, [navigation, currentUser?.uid]);

  // ❤️ Swipe right (like user) — granular logging to pinpoint rules issues
  const handleSwipeRight = async (cardIndex) => {
    const sel = users[cardIndex];
    const meUser = auth.currentUser;
    if (!sel || !meUser) return;

    const myId = meUser.uid;
    const theirId = sel.id;

    try {
      // STEP 1: write my like (users/{myId}/likes/{theirId})
      try {
        await setDoc(doc(db, "users", myId, "likes", theirId), {
          liked: true,
          timestamp: serverTimestamp(),
        });
      } catch (err) {
        console.error("likes/write (my like) failed:", err);
        Alert.alert("Error", "Could not register your like (permissions).");
        return;
      }

      // STEP 2: read their like back (users/{theirId}/likes/{myId})
      let theyLikedBack = false;
      try {
        const theirLikeRef = doc(db, "users", theirId, "likes", myId);
        const theirLikeSnap = await getDoc(theirLikeRef);
        theyLikedBack = theirLikeSnap.exists();
      } catch (err) {
        console.error("likes/read (their like) failed:", err);
        Alert.alert("Error", "Could not check mutual like (permissions).");
        return;
      }

      if (!theyLikedBack) return; // no match yet

      // STEP 3: check existing matches (matches where I am a participant)
      let alreadyMatched = false;
      try {
        const existing = await getDocs(
          query(collection(db, "matches"), where("users", "array-contains", myId))
        );
        alreadyMatched = existing.docs.some((m) =>
          (m.data().users || []).includes(theirId)
        );
      } catch (err) {
        console.error("matches/read (existing) failed:", err);
        Alert.alert("Error", "Could not verify existing matches (permissions).");
        return;
      }

      if (alreadyMatched) return;

      // STEP 4: create the match (users includes me => rules allow create)
      try {
        await addDoc(collection(db, "matches"), {
          users: [myId, theirId],
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("matches/create failed:", err);
        Alert.alert("Error", "Could not create match (permissions).");
      }
    } catch (error) {
      console.error("Swipe error (uncaught):", error);
      Alert.alert("Error", "Something went wrong while liking this user.");
    }
  };

  // 🚪 Logout handler
  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.reset({ index: 0, routes: [{ name: "Auth" }] });
    } catch (error) {
      Alert.alert("Logout Error", error.message);
    }
  };

  // Initials for avatar fallback
  const initials = (me?.name || "")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Loading screen
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Loading gym buddies...</Text>
      </View>
    );
  }

  // No users
  if (users.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="fitness-outline" size={60} color="#ccc" />
        <Text style={styles.text}>No gym buddies found yet 😢</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main UI
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Profile")}
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

        <Text style={styles.title}>🏋️ Gym Buddy Finder</Text>

        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Matches")}
            style={styles.iconButton}
          >
            <Ionicons name="heart-outline" size={22} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
            <Ionicons name="log-out-outline" size={22} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Swiper */}
      <Swiper
        cards={users}
        renderCard={(user) => (
          <View style={styles.card}>
            <Image
              source={{
                uri:
                  user.photoURL ||
                  "https://via.placeholder.com/400x400.png?text=No+Image",
              }}
              style={styles.image}
            />
            <Text style={styles.name}>{user.name || "Unnamed User"}</Text>
            {user.gymName && <Text style={styles.detail}>Gym: {user.gymName}</Text>}
            {user.workoutType && (
              <Text style={styles.detail}>Workout: {user.workoutType}</Text>
            )}
            {user.timing && <Text style={styles.detail}>Time: {user.timing}</Text>}
          </View>
        )}
        onSwipedRight={handleSwipeRight}
        backgroundColor="#f5f5f5"
        stackSize={3}
        animateCardOpacity
        disableTopSwipe
        disableBottomSwipe
      />
    </View>
  );
}

const AVATAR_SIZE = 36;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9", paddingTop: 60 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 10,
    justifyContent: "space-between",
  },
  title: { fontSize: 18, fontWeight: "700", color: "#007AFF" },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: {
    padding: 6,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
  },

  // Profile avatar button (left)
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

  card: {
    flex: 0.75,
    borderRadius: 20,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    padding: 10,
    marginHorizontal: 10,
  },
  image: {
    width: "90%",
    height: 320,
    borderRadius: 15,
    marginBottom: 15,
  },
  name: { fontSize: 22, fontWeight: "bold", color: "#333" },
  detail: { fontSize: 16, color: "#555", marginTop: 4 },

  text: { fontSize: 18, color: "#555", textAlign: "center", marginBottom: 10 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  logoutButton: {
    backgroundColor: "#ff3b30",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  logoutText: { color: "#fff", fontWeight: "bold" },
});
