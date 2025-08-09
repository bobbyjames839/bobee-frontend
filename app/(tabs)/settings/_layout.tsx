import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '~/constants/Colors';

function BackChevron() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      style={{
        paddingHorizontal: 8,  
        marginLeft: -4,        
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
        headerStyle: { backgroundColor: colors.lightest },
        headerShadowVisible: false,

        headerTitleStyle: { fontFamily: 'SpaceMono' },
        headerTintColor: colors.darkest,

        headerBackVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
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
