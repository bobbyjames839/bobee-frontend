import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="response"
        options={{
          // ensure horizontal swipe-back works
          presentation: 'card',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />
    </Stack>
  );
}
