import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function FilesStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.select({
          ios: 'slide_from_right',
          android: 'slide_from_right',
          default: 'default',
        }),
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        // iOS-only: swipe anywhere on screen to go back (not just from the edge)
        fullScreenGestureEnabled: Platform.OS === 'ios',
        contentStyle: { backgroundColor: 'transparent' },
      }}
      initialRouteName="index"
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="day" />
    </Stack>
  );
}
