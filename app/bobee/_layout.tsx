import { Stack } from 'expo-router';

export default function BobeeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'card',
        animation: 'slide_from_right',
        gestureEnabled: false,
      }}
    >
      <Stack.Screen
        name="chat"
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="reflection"
        options={{
          presentation: 'card',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
      <Stack.Screen
        name="personal-message"
        options={{
          presentation: 'card',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
    </Stack>
  );
}