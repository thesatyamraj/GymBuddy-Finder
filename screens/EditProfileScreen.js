// screens/EditProfileScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function EditProfileScreen({ navigation }) {
  const user = auth.currentUser;
  const [name, setName] = useState("");
  const [gymName, setGymName] = useState("");
  const [workoutType, setWorkoutType] = useState("");
  const [timing, setTiming] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔄 Load current profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!user) {
          Alert.alert("Not signed in", "Please log in again.");
          navigation.reset({ index: 0, routes: [{ name: "Auth" }] });
          return;
        }
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setName(d.name || "");
          setGymName(d.gymName || "");
          setWorkoutType(d.workoutType || "");
          setTiming(d.timing || "");
          setImageBase64(d.photoURL || null); // Base64 data URL stored in Firestore
        }
      } catch (e) {
        console.error("Load profile error:", e);
        Alert.alert("Error", "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // 📸 Pick & compress new image (Base64) — version-proof across ImagePicker releases
  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "Please allow gallery access.");
        return;
      }

      // Resolve mediaTypes across versions:
      // - Newer versions: ImagePicker.MediaType.Images
      // - Older versions: ImagePicker.MediaTypeOptions.Images
      const MediaTypeEnum = ImagePicker.MediaType || ImagePicker.MediaTypeOptions;
      const options = {
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      };
      if (MediaTypeEnum?.Images) {
        options.mediaTypes = MediaTypeEnum.Images;
      }
      // If neither exists, we omit mediaTypes and let it default.

      const result = await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets?.length) return;

      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 512 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!manipulated.base64) {
        Alert.alert("Error", "Could not process image.");
        return;
      }
      setImageBase64(`data:image/jpeg;base64,${manipulated.base64}`);
    } catch (err) {
      console.error("Image picker error:", err);
      Alert.alert("Error", "Could not open image picker.");
    }
  };

  const clearImage = () => setImageBase64(null);

  // 💾 Save updates (Firestore only, no Storage)
  const saveProfile = async () => {
    if (!name.trim() || !gymName.trim() || !workoutType.trim() || !timing.trim()) {
      Alert.alert("Incomplete", "Please fill in all fields.");
      return;
    }

    try {
      setSaving(true);
      await setDoc(
        doc(db, "users", user.uid),
        {
          userId: user.uid,
          name: name.trim(),
          gymName: gymName.trim(),
          workoutType: workoutType.trim(),
          timing: timing.trim(),
          email: user.email || null,
          photoURL: imageBase64 || null, // Base64 data URL
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      Alert.alert("✅ Success", "Your profile has been updated.");
      navigation.navigate("Profile");
    } catch (e) {
      console.error("Save profile error:", e);
      Alert.alert("Error", "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Loading profile…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>✏️ Edit Profile</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {imageBase64 ? (
          <Image source={{ uri: imageBase64 }} style={styles.image} />
        ) : (
          <Text style={styles.imageText}>Tap to choose profile photo</Text>
        )}
      </TouchableOpacity>

      {imageBase64 ? (
        <TouchableOpacity onPress={clearImage} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>Remove Photo</Text>
        </TouchableOpacity>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Your Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Gym Name"
        value={gymName}
        onChangeText={setGymName}
      />
      <TextInput
        style={styles.input}
        placeholder="Workout Type (e.g. Cardio, Weightlifting)"
        value={workoutType}
        onChangeText={setWorkoutType}
      />
      <TextInput
        style={styles.input}
        placeholder="Preferred Timing (e.g. Morning, Evening)"
        value={timing}
        onChangeText={setTiming}
      />

      <TouchableOpacity
        style={[styles.saveButton, saving && { opacity: 0.7 }]}
        onPress={saveProfile}
        disabled={saving}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#fff" },
  title: {
    fontSize: 24, fontWeight: "bold", color: "#007AFF",
    textAlign: "center", marginBottom: 16,
  },
  imagePicker: {
    alignSelf: "center",
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center",
    overflow: "hidden", marginBottom: 10,
  },
  image: { width: "100%", height: "100%" },
  imageText: { color: "#888", textAlign: "center", paddingHorizontal: 10 },
  clearBtn: {
    alignSelf: "center",
    backgroundColor: "#E74C3C",
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, marginBottom: 16,
  },
  clearBtnText: { color: "#fff", fontWeight: "600" },
  input: {
    borderWidth: 1, borderColor: "#ccc", borderRadius: 10,
    padding: 12, marginBottom: 12, fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    borderRadius: 10, padding: 15, alignItems: "center", marginTop: 8,
  },
  saveButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
});
