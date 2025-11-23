import { Stack } from 'expo-router';

export default function FilesTabStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'card',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="day"
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          animation: 'slide_from_bottom',
          animationDuration: 500, // make this smaller = faster (default is 350)
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
