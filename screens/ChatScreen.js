// screens/ChatScreen.js
import React, { useEffect, useState, useLayoutEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
} from "firebase/firestore";

export default function ChatScreen({ route, navigation }) {
  const { matchUser } = route.params || {};
  const currentUser = auth.currentUser;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const sendingRef = useRef(false);
  const flatListRef = useRef();

  const goBackToTabs = () => {
    try {
      navigation.navigate("HomeTabs");
    } catch {
      navigation.goBack();
    }
  };

  if (!matchUser || !currentUser) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#666", fontSize: 16 }}>Unable to open chat.</Text>
        <TouchableOpacity style={styles.backButton} onPress={goBackToTabs}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Stable chat ID for the pair (sorted)
  const chatId =
    currentUser.uid > matchUser.id
      ? `${currentUser.uid}_${matchUser.id}`
      : `${matchUser.id}_${currentUser.uid}`;

  // Header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: matchUser.name || "Chat",
      headerStyle: { backgroundColor: "#007AFF" },
      headerTintColor: "#fff",
      headerTitleAlign: "center",
    });
  }, [navigation, matchUser?.name]);

  // Create/patch chat doc (no reads) then subscribe to messages
  useEffect(() => {
    let unsubscribe;
    let cancelled = false;

    const createAndListen = async () => {
      try {
        // Upsert the chat doc so rules for messages can check parent users array
        await setDoc(
          doc(db, "chats", chatId),
          {
            users: [currentUser.uid, matchUser.id],
            // createdAt is harmless to re-set; server will write once if missing
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );

        const q = query(
          collection(db, "chats", chatId, "messages"),
          orderBy("createdAt", "asc")
        );

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (cancelled) return;
            const msgs = snapshot.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }));
            setMessages(msgs);
            setLoading(false);
          },
          (error) => {
            console.error("Chat listener error:", error);
            setLoading(false);
            Alert.alert("Error", "Unable to load chat messages.");
          }
        );
      } catch (err) {
        console.error("Chat init error:", err);
        setLoading(false);
        Alert.alert("Error", "Could not initialize chat.");
      }
    };

    createAndListen();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [chatId, currentUser.uid, matchUser.id]);

  // Send message (no reads; upsert chat meta with merge)
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sendingRef.current) return;
    sendingRef.current = true;

    try {
      // Upsert chat metadata (works for both create & update per your rules)
      await setDoc(
        doc(db, "chats", chatId),
        {
          users: [currentUser.uid, matchUser.id],
          lastMessage: text,
          lastMessageTimestamp: serverTimestamp(),
          // keep createdAt if it exists; if not, server sets it
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Add the message
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text,
        senderId: currentUser.uid,
        receiverId: matchUser.id,
        createdAt: serverTimestamp(),
      });

      setInput("");

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 120);
    } catch (error) {
      console.error("Send message error:", error);
      Alert.alert("Error", "Could not send message. Try again.");
    } finally {
      sendingRef.current = false;
    }
  };

  const renderItem = ({ item }) => {
    const isCurrentUser = item.senderId === currentUser.uid;
    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.sent : styles.received,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: isCurrentUser ? "#fff" : "#000" },
          ]}
        >
          {item.text}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.chatArea}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input Box */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
          placeholderTextColor="#888"
          returnKeyType="send"
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Ionicons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f0f0" },
  chatArea: { padding: 10, paddingBottom: 80 },
  messageContainer: {
    maxWidth: "75%",
    padding: 10,
    borderRadius: 15,
    marginVertical: 6,
  },
  sent: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
    borderBottomRightRadius: 0,
  },
  received: {
    backgroundColor: "#E5E5EA",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 0,
  },
  messageText: { fontSize: 16 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#ddd",
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 6 },
  sendButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 50,
    marginLeft: 6,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  backButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  backText: { color: "#fff", fontWeight: "bold" },
});
