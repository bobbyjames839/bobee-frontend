import React from 'react';
import { Tabs } from 'expo-router';
import { PenLine, FileText, Sparkles, Settings, User } from 'lucide-react-native';
import { colors } from '~/constants/Colors';

export default function TabLayout() {

  const baseTabBarStyle = {
    elevation: 0,
    backgroundColor: 'white',
    height: 80,
    borderTopWidth: 1,
    borderColor: colors.lighter,
  } as const;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#4f50e3',
        tabBarStyle: baseTabBarStyle,
      }}
    >
      <Tabs.Screen
        name="journal"
        options={{
          tabBarIcon: ({ color }) => <PenLine color={color} size={26} strokeWidth={2} style={{ marginTop: 30 }} />,
        }}
      />
      <Tabs.Screen
        name="files"
        options={{
          tabBarIcon: ({ color }) => <FileText color={color} size={26} strokeWidth={2} style={{ marginTop: 30 }} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          tabBarIcon: ({ color }) => <Sparkles color={color} size={26} strokeWidth={2} style={{ marginTop: 30 }} />,
        }}
      />
      <Tabs.Screen
        name="bobee"
        options={{
          tabBarIcon: ({ color }) => <User color={color} size={26} strokeWidth={2} style={{ marginTop: 30 }} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color }) => <Settings color={color} size={26} strokeWidth={2} style={{ marginTop: 30 }} />,
        }}
      />
    </Tabs>
  );
}
