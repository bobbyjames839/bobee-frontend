import React from 'react';
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        gestureDirection: 'horizontal',
        animation: 'slide_from_right',
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          animation: 'slide_from_left',   // 👈 index now comes in from the left
        }}
      />
      <Stack.Screen name="how" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="priv" />
      <Stack.Screen name="sub" />
      <Stack.Screen name="account" />
      <Stack.Screen name="contact" />
    </Stack>
  );
}
