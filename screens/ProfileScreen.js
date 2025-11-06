import React, { useEffect, useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ProfileScreen({ navigation }) {
  const user = auth.currentUser;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🧩 Load current user's profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!user) {
          Alert.alert("Session expired", "Please log in again.");
          navigation.reset({ index: 0, routes: [{ name: "Auth" }] });
          return;
        }

        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          navigation.reset({ index: 0, routes: [{ name: "ProfileSetup" }] });
        }
      } catch (e) {
        console.error("Load profile error:", e);
        Alert.alert("Error", "Failed to load your profile.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  // 🧭 Go to edit screen
  const goToEdit = () => {
    navigation.navigate("EditProfile", { profile });
  };

  // 🧭 Add header edit icon
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: "My Profile",
      headerStyle: { backgroundColor: "#007AFF" },
      headerTintColor: "#fff",
      headerRight: () => (
        <TouchableOpacity onPress={goToEdit} style={{ marginRight: 14 }}>
          <Ionicons name="create-outline" size={22} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, profile]);

  // ⏳ Loading
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Loading your profile…</Text>
      </View>
    );
  }

  // ❌ No profile found
  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#666" }}>No profile found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Picture */}
      <View style={styles.avatarWrap}>
        <Image
          source={{
            uri:
              profile.photoURL ||
              "https://via.placeholder.com/300x300.png?text=No+Photo",
          }}
          style={styles.avatar}
        />
      </View>

      <Text style={styles.name}>{profile.name || "Unnamed User"}</Text>

      {/* Profile Info */}
      <View style={styles.card}>
        <InfoRow icon="mail-outline" label="Email" value={profile.email || "-"} />
        <InfoRow icon="barbell-outline" label="Gym" value={profile.gymName || "-"} />
        <InfoRow
          icon="fitness-outline"
          label="Workout Type"
          value={profile.workoutType || "-"}
        />
        <InfoRow
          icon="time-outline"
          label="Preferred Time"
          value={profile.timing || "-"}
        />
      </View>

      {/* Edit Button */}
      <TouchableOpacity style={styles.primaryBtn} onPress={goToEdit}>
        <Text style={styles.btnText}>Edit Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ✅ Info row with icon + label + value
function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.row}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Ionicons name={icon} size={18} color="#007AFF" />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  avatarWrap: {
    alignSelf: "center",
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: "hidden",
    backgroundColor: "#f1f1f1",
    marginBottom: 14,
  },
  avatar: { width: "100%", height: "100%" },
  name: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    color: "#222",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
  rowLabel: { color: "#555", fontWeight: "600" },
  rowValue: { color: "#222", maxWidth: "60%", textAlign: "right" },
  primaryBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 18,
  },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
