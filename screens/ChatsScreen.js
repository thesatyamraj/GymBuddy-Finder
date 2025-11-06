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
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  getDoc,
  doc,
} from "firebase/firestore";
import { auth, db } from "../firebase";

export default function ChatsScreen({ navigation }) {
  const [chats, setChats] = useState([]);
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

  // 🧩 Real-time listener for user's chats
  useEffect(() => {
    if (!currentUser) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Auth" }],
      });
      return;
    }

    const q = query(
      collection(db, "chats"),
      where("users", "array-contains", currentUser.uid),
      orderBy("lastMessageTimestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const chatList = [];

        for (const chatDoc of snapshot.docs) {
          const chatData = chatDoc.data();
          const otherUserId = chatData.users.find(
            (uid) => uid !== currentUser.uid
          );

          if (!otherUserId) continue;

          try {
            const userRef = doc(db, "users", otherUserId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              chatList.push({
                id: chatDoc.id,
                otherUser: { id: otherUserId, ...userSnap.data() },
                lastMessage: chatData.lastMessage || "Start chatting 💬",
                lastMessageTimestamp: chatData.lastMessageTimestamp,
              });
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        }

        setChats(chatList);
        setLoading(false);
      },
      (error) => {
        console.error("Chat fetch error:", error);
        Alert.alert("Error", "Could not load your chats.");
        setLoading(false);
      }
    );

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

  // ⏳ Loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Loading your chats...</Text>
      </View>
    );
  }

  // 😕 No chats yet
  if (chats.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="chatbubble-outline" size={60} color="#ccc" />
        <Text style={styles.noChatText}>No chats yet. Start a conversation 💬</Text>
      </View>
    );
  }

  // 💬 Main chat list
  return (
    <View style={styles.container}>
      {/* Header with profile icon */}
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

        <Text style={styles.headerTitle}>💬 Chats</Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Matches")}
        >
          <Ionicons name="heart-outline" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={chats.sort(
          (a, b) =>
            (b.lastMessageTimestamp?.seconds || 0) -
            (a.lastMessageTimestamp?.seconds || 0)
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() => navigation.navigate("Chat", { matchUser: item.otherUser })}
          >
            <Image
              source={{
                uri:
                  item.otherUser.photoURL ||
                  item.otherUser.profileImage ||
                  item.otherUser.image ||
                  "https://via.placeholder.com/150",
              }}
              style={styles.avatar}
            />
            <View style={styles.info}>
              <Text style={styles.name}>{item.otherUser.name || "Gym Buddy"}</Text>
              <Text style={styles.message} numberOfLines={1}>
                {item.lastMessage || "Tap to start chatting..."}
              </Text>
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
  noChatText: { fontSize: 18, color: "#777", marginTop: 10, textAlign: "center" },
  chatItem: {
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
  message: { fontSize: 14, color: "#666", marginTop: 2 },
});
