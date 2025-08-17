import { Stack } from "expo-router";

export default function BobeeStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,            // iOS: swipe-to-go-back
        fullScreenGestureEnabled: true,  // iOS: anywhere on screen
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="chat" />
    </Stack>
  );
}
