// app/(tabs)/settings/_layout.tsx
import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '~/constants/Colors';

// Custom back‐button that sits closer to the screen edge
function BackChevron() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      style={{
        paddingHorizontal: 8,  // smaller tap padding
        marginLeft: -4,        // nudge icon left
      }}
    >
      <Ionicons name="chevron-back" size={24} color={colors.darkest} />
    </TouchableOpacity>
  );
}

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        // Pale background, no hairline
        headerStyle: { backgroundColor: colors.lightest },
        headerShadowVisible: false,

        // SpaceMono title font + dark tint for chevron
        headerTitleStyle: { fontFamily: 'SpaceMono' },
        headerTintColor: colors.darkest,

        // Turn off the built‐in back button completely
        headerBackVisible: false,
      }}
    >
      {/* list page: hide native header */}
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />

      {/* detail pages: each gets a title + our custom chevron */}
      <Stack.Screen
        name="how"
        options={{
          title: 'How to use',
          headerLeft: () => <BackChevron />,
        }}
      />
      <Stack.Screen
        name="terms"
        options={{
          title: 'Terms & Conditions',
          headerLeft: () => <BackChevron />,
        }}
      />
      <Stack.Screen
        name="priv"
        options={{
          title: 'Privacy Statement',
          headerLeft: () => <BackChevron />,
        }}
      />
      <Stack.Screen
        name="sub"
        options={{
          title: 'Subscription',
          headerLeft: () => <BackChevron />,
        }}
      />
      <Stack.Screen
        name="account"
        options={{
          title: 'Account',
          headerLeft: () => <BackChevron />,
        }}
      />
    </Stack>
  );
}
