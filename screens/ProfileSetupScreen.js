// screens/ProfileSetupScreen.js
import React, { useState } from "react";
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
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";

export default function ProfileSetupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [gymName, setGymName] = useState("");
  const [workoutType, setWorkoutType] = useState("");
  const [timing, setTiming] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);

  // 📸 Pick & compress profile image (Base64 data URL)
  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "Please allow gallery access to pick an image.");
        return;
      }

      // Work across old/new expo-image-picker APIs
      const MediaTypeEnum = ImagePicker.MediaType ?? ImagePicker.MediaTypeOptions;

      const options = {
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1, // compress after with ImageManipulator
        mediaTypes: MediaTypeEnum?.Images, // avoids deprecation warnings
      };

      const result = await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets?.length) return;

      // Resize + compress to keep under Firestore field size (~1 MiB)
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
      Alert.alert("Error", "Failed to open image picker.");
    }
  };

  // 💾 Save user profile in Firestore
  const handleSaveProfile = async () => {
    if (loading) return; // prevent double taps
    if (!name.trim() || !gymName.trim() || !workoutType.trim() || !timing.trim()) {
      Alert.alert("Incomplete Information", "Please fill in all fields before saving.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "No authenticated user found.");
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid,
        name: name.trim(),
        gymName: gymName.trim(),
        workoutType: workoutType.trim(),
        timing: timing.trim(),
        email: user.email || null,
        photoURL: imageBase64 || null, // Base64 data URL
        createdAt: serverTimestamp(),
      });

      Alert.alert("✅ Profile Created", "Your profile has been saved successfully!");

      // Keep your sign-out (to re-run the gating and pick up hasProfile),
      // but use reset instead of replace to avoid the warning.
      await signOut(auth);
      navigation.reset({ index: 0, routes: [{ name: "Auth" }] });
    } catch (error) {
      console.error("Profile setup error:", error);
      Alert.alert("Error", error.message || "Failed to save profile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🏋️‍♂️ Set Up Your Profile</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {imageBase64 ? (
          <Image source={{ uri: imageBase64 }} style={styles.image} />
        ) : (
          <Text style={styles.imageText}>Tap to select a profile photo</Text>
        )}
      </TouchableOpacity>

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
        style={[styles.saveButton, loading && { opacity: 0.7 }]}
        onPress={handleSaveProfile}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Profile</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#fff", justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 20, color: "#007AFF" },
  imagePicker: {
    alignSelf: "center",
    marginBottom: 20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  imageText: { color: "#888", textAlign: "center", paddingHorizontal: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 16 },
  saveButton: { backgroundColor: "#007AFF", borderRadius: 10, padding: 15, alignItems: "center", marginTop: 10 },
  saveButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
