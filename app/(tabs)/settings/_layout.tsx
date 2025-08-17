import React from 'react';
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        // gestures
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        gestureDirection: 'horizontal',
        animation: 'slide_from_right',

        // completely hide native headers
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="how" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="priv" />
      <Stack.Screen name="sub" />
      <Stack.Screen name="account" />
      <Stack.Screen name="contact" />
    </Stack>
  );
}
