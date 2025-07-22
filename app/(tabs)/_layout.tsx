// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { PenLine, FileText, Sparkles, Settings, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#4f50e3',
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: '#fff',
          height: 70,
        },
      }}
    >
      <Tabs.Screen
        name="journal"
        options={{
          tabBarIcon: ({ color }) => (
            <PenLine color={color} size={26} strokeWidth={2} style={{ marginTop: 8 }} />
          ),
        }}
      />
      <Tabs.Screen
        name="files"
        options={{
          tabBarIcon: ({ color }) => (
            <FileText color={color} size={26} strokeWidth={2} style={{ marginTop: 8 }} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          tabBarIcon: ({ color }) => (
            <Sparkles color={color} size={26} strokeWidth={2} style={{ marginTop: 8 }} />
          ),
        }}
      />
      <Tabs.Screen
        name="bobee"
        options={{
          tabBarIcon: ({ color }) => (
            <User color={color} size={26} strokeWidth={2} style={{ marginTop: 8 }} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color }) => (
            <Settings color={color} size={26} strokeWidth={2} style={{ marginTop: 8 }} />
          ),
        }}
      />
      {/*
        If you want a “catch-all” (404) screen in this tab group, you can create
        `app/(tabs)/[...404].tsx`. Expo Router will automatically pick it up.
      */}
    </Tabs>
  );
}
