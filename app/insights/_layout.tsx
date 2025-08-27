import { Stack } from 'expo-router'

export default function InsightsSectionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'card',
        animation: 'slide_from_right',
      }}
    />
  )
}
