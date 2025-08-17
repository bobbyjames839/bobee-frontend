import { Stack } from "expo-router";

export default function BobeeStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          animation: 'none',
        }}
      />
      <Stack.Screen
        name="chat"
        options={{
          gestureEnabled: false,
          fullScreenGestureEnabled: false,
          animation: 'none',
        }}
      />
    </Stack>
  );
}
