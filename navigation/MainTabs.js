import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebase";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

// Screens
import SwipeScreen from "../screens/SwipeScreen";
import MatchesScreen from "../screens/MatchesScreen";
import ChatsScreen from "../screens/ChatsScreen";

const Tab = createBottomTabNavigator();
const SwipeStack = createNativeStackNavigator();

/**
 * 🧩 Swipes tab with custom header showing user's profile icon (top-right)
 */
function SwipeStackNavigator({ navigation }) {
  const [userPhoto, setUserPhoto] = useState(null);

  useEffect(() => {
    const fetchUserPhoto = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserPhoto(userDoc.data().photoURL);
        }
      } catch (err) {
        console.error("Error fetching user photo:", err);
      }
    };
    fetchUserPhoto();
  }, []);

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
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("Profile")}
              style={{ marginRight: 15 }}
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
          ),
        }}
      />
    </SwipeStack.Navigator>
  );
}

/**
 * 🧭 Bottom Tabs (Swipes, Matches, Chats)
 */
export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Swipes"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#888",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0.4,
          borderTopColor: "#ddd",
          height: 60,
          paddingBottom: 6,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Swipes") {
            iconName = focused ? "flame" : "flame-outline";
          } else if (route.name === "Matches") {
            iconName = focused ? "heart" : "heart-outline";
          } else if (route.name === "Chats") {
            iconName = focused
              ? "chatbubble-ellipses"
              : "chatbubble-ellipses-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Swipes"
        component={SwipeStackNavigator}
        options={{
          title: "Swipes",
          tabBarLabel: "Swipes",
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          title: "Matches",
          tabBarLabel: "Matches",
        }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatsScreen}
        options={{
          title: "Chats",
          tabBarLabel: "Chats",
        }}
      />
    </Tab.Navigator>
  );
}
