// app/files/_layout.tsx
import { Stack } from 'expo-router';

export default function FilesStackOutsideTabs() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'card',           // behaves like push
        animation: 'slide_from_right',  // slide in/out from the right
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        fullScreenGestureEnabled: true, // enables iOS full-screen swipe
      }}
    />
  );
}
