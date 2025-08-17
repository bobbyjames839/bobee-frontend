import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',      // iOS modal style
        statusBarTranslucent: true, // matches our translucent StatusBar
      }}
    />
  );
}
