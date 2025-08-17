import React from 'react';
import { Tabs, usePathname } from 'expo-router';
import { PenLine, FileText, Sparkles, Settings, User } from 'lucide-react-native';
import { colors } from '~/constants/Colors';

export default function TabLayout() {
  const pathname = usePathname(); // e.g. "/", "/settings", "/settings/sub", "/bobee/chat"

  const baseTabBarStyle = {
    elevation: 0,
    backgroundColor: 'white',
    height: 75,
    borderTopWidth: 1,
    borderColor: colors.lighter,
  } as const;

  // Is the user on any "deeper" page under a tab?
  const isDeeper =
    pathname.startsWith('/journal/') ||
    pathname.startsWith('/files/') ||
    pathname.startsWith('/insights/') ||
    pathname.startsWith('/bobee/') ||
    pathname.startsWith('/settings/');

  // Exception: show the tabs specifically on /settings/sub
  const isSettingsSub = pathname === '/settings/sub';

  // Root tab pages should show the bar
  const isTabRoot =
    pathname === '/journal' ||
    pathname === '/files' ||
    pathname === '/insights' ||
    pathname === '/bobee' ||
    pathname === '/settings' ||
    pathname === '/'; // in case your default route maps to a tab

  const shouldHide = isDeeper && !isSettingsSub;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#4f50e3',
        // merge styles instead of replacing, and toggle display
        tabBarStyle: shouldHide ? [{ ...baseTabBarStyle }, { display: 'none' }] : baseTabBarStyle,
      }}
    >
      <Tabs.Screen
        name="journal"
        options={{
          tabBarIcon: ({ color }) => <PenLine color={color} size={26} strokeWidth={2} style={{ marginTop: 15 }} />,
        }}
      />
      <Tabs.Screen
        name="files"
        options={{
          tabBarIcon: ({ color }) => <FileText color={color} size={26} strokeWidth={2} style={{ marginTop: 15 }} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          tabBarIcon: ({ color }) => <Sparkles color={color} size={26} strokeWidth={2} style={{ marginTop: 15 }} />,
        }}
      />
      <Tabs.Screen
        name="bobee"
        options={{
          tabBarIcon: ({ color }) => <User color={color} size={26} strokeWidth={2} style={{ marginTop: 15 }} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color }) => <Settings color={color} size={26} strokeWidth={2} style={{ marginTop: 15 }} />,
        }}
      />
    </Tabs>
  );
}
