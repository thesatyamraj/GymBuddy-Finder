// Navigation.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AuthScreen from "./screens/AuthScreen";
import ProfileSetupScreen from "./screens/ProfileSetupScreen";
import SwipeScreen from "./screens/SwipeScreen";

const Stack = createNativeStackNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AuthScreen">
        <Stack.Screen name="AuthScreen" component={AuthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProfileScreen" component={ProfileSetupScreen} />
        <Stack.Screen name="SwipeScreen" component={SwipeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
