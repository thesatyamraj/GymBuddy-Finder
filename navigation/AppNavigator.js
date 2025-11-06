// navigation/AppNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import AuthScreen from "../screens/AuthScreen";
import ProfileSetupScreen from "../screens/ProfileSetupScreen";
import MainTabs from "./MainTabs";
import ChatScreen from "../screens/ChatScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";

// 👇 Export stable IDs so nested screens can target parents reliably
export const ROOT_STACK_ID = "RootStack";
export const MAIN_STACK_ID = "MainStack";

const RootStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

/**
 * 💡 Main stack (sits above the tab navigator)
 * Includes: Tabs → Profile → EditProfile → Chat
 */
function MainStackScreen() {
  return (
    <MainStack.Navigator id={MAIN_STACK_ID}>
      {/* Bottom tabs (note: named HomeTabs to avoid same-name nesting) */}
      <MainStack.Screen
        name="HomeTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />

      {/* Profile view (for current user only) */}
      <MainStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          title: "My Profile",
          headerStyle: { backgroundColor: "#007AFF" },
          headerTintColor: "#fff",
        }}
      />

      {/* Edit profile */}
      <MainStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          headerShown: true,
          title: "Edit Profile",
          headerStyle: { backgroundColor: "#007AFF" },
          headerTintColor: "#fff",
        }}
      />

      {/* Chat screen */}
      <MainStack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: true,
          title: "Chat",
          headerStyle: { backgroundColor: "#007AFF" },
          headerTintColor: "#fff",
        }}
      />
    </MainStack.Navigator>
  );
}

/**
 * 🚀 Root stack decides the flow:
 *  - Not logged in → Auth
 *  - Logged in, no profile → ProfileSetup
 *  - Logged in + profile → MainStack (Tabs + Profile + Chat)
 */
export default function AppNavigator({ user, hasProfile }) {
  return (
    <RootStack.Navigator id={ROOT_STACK_ID} screenOptions={{ headerShown: false }}>
      {!user ? (
        <RootStack.Screen name="Auth" component={AuthScreen} />
      ) : !hasProfile ? (
        <RootStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      ) : (
        <RootStack.Screen name="Main" component={MainStackScreen} />
      )}
    </RootStack.Navigator>
  );
}
