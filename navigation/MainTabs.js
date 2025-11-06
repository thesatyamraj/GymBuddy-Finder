// navigation/MainTabs.js
import React, { useEffect, useState } from "react";
import { TouchableOpacity, Image } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

// Screens
import SwipeScreen from "../screens/SwipeScreen";
import MatchesScreen from "../screens/MatchesScreen";
import ChatsScreen from "../screens/ChatsScreen";

const Tab = createBottomTabNavigator();
const SwipeStack = createNativeStackNavigator();
const MatchesStack = createNativeStackNavigator();
const ChatsStack = createNativeStackNavigator();

/** Small helper to show the current user's avatar in headerRight */
function HeaderAvatar({ navigation, userPhoto }) {
  return (
    <TouchableOpacity
      onPress={() => navigation.getParent()?.navigate("Profile")}
      style={{ marginRight: 15 }}
      activeOpacity={0.8}
    >
      {userPhoto ? (
        <Image
          source={{ uri: userPhoto }}
          style={{
            width: 35,
            height: 35,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: "#007AFF",
          }}
        />
      ) : (
        <Ionicons name="person-circle-outline" size={32} color="#007AFF" />
      )}
    </TouchableOpacity>
  );
}

/** Reusable hook to fetch current user's photoURL */
function useMyPhoto() {
  const [userPhoto, setUserPhoto] = useState(null);
  useEffect(() => {
    const fetchUserPhoto = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) setUserPhoto(userDoc.data().photoURL || null);
      } catch (e) {
        console.log("Header avatar load error:", e);
      }
    };
    fetchUserPhoto();
  }, []);
  return userPhoto;
}

/** Swipes tab (stack) with header avatar */
function SwipeStackNavigator({ navigation }) {
  const userPhoto = useMyPhoto();
  return (
    <SwipeStack.Navigator>
      <SwipeStack.Screen
        name="SwipesMain"
        component={SwipeScreen}
        options={{
          title: "🏋️ Gym Buddy Finder",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#fff" },
          headerTintColor: "#007AFF",
          headerRight: () => <HeaderAvatar navigation={navigation} userPhoto={userPhoto} />,
        }}
      />
    </SwipeStack.Navigator>
  );
}

/** Matches tab (stack) with header avatar */
function MatchesStackNavigator({ navigation }) {
  const userPhoto = useMyPhoto();
  return (
    <MatchesStack.Navigator>
      <MatchesStack.Screen
        name="MatchesMain"
        component={MatchesScreen}
        options={{
          title: "❤️ Matches",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#fff" },
          headerTintColor: "#007AFF",
          headerRight: () => <HeaderAvatar navigation={navigation} userPhoto={userPhoto} />,
        }}
      />
    </MatchesStack.Navigator>
  );
}

/** Chats tab (stack) with header avatar */
function ChatsStackNavigator({ navigation }) {
  const userPhoto = useMyPhoto();
  return (
    <ChatsStack.Navigator>
      <ChatsStack.Screen
        name="ChatsMain"
        component={ChatsScreen}
        options={{
          title: "💬 Chats",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#fff" },
          headerTintColor: "#007AFF",
          headerRight: () => <HeaderAvatar navigation={navigation} userPhoto={userPhoto} />,
        }}
      />
    </ChatsStack.Navigator>
  );
}

/** Bottom Tabs */
export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Swipes"
      screenOptions={({ route }) => ({
        headerShown: false, // headers handled by each stack above
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#888",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0.4,
          borderTopColor: "#ddd",
          height: 60,
          paddingBottom: 6,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Swipes") iconName = focused ? "flame" : "flame-outline";
          else if (route.name === "Matches") iconName = focused ? "heart" : "heart-outline";
          else if (route.name === "Chats") iconName = focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Swipes" component={SwipeStackNavigator} options={{ title: "Swipes" }} />
      <Tab.Screen name="Matches" component={MatchesStackNavigator} options={{ title: "Matches" }} />
      <Tab.Screen name="Chats" component={ChatsStackNavigator} options={{ title: "Chats" }} />
    </Tab.Navigator>
  );
}
