import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { PenLine, FileText, Sparkles, Settings, User } from 'lucide-react-native';
import { colors } from '~/constants/Colors';
import { useJournalContext } from '~/context/JournalContext';

type IconType = React.ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

const TABS = {
  journal: { label: 'Journal', Icon: PenLine as IconType },
  files: { label: 'Files', Icon: FileText as IconType },
  insights: { label: 'Insights', Icon: Sparkles as IconType },
  bobee: { label: 'Bobee', Icon: User as IconType },
  settings: { label: 'Settings', Icon: Settings as IconType },
} as const;

type TabKey = keyof typeof TABS;

function MyTabBar({ state, navigation }: BottomTabBarProps) {
  const journal = useJournalContext();
  const isFullscreen = journal.isRecording || journal.loading;

  if (isFullscreen) {
    return null;
  }

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const name = route.name as TabKey;
        const config = TABS[name];

        const label = config?.label ?? route.name;
        const Icon = (config?.Icon ?? PenLine) as IconType;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[styles.tabItem]}
            activeOpacity={0.8}
          >
            {/* Short, centered top bar when active */}
            {isFocused && <View style={styles.activeBar} />}

            <Icon color={isFocused ? colors.blue : '#696969ff'} size={24} strokeWidth={2} />
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
      tabBar={(props) => <MyTabBar {...props} />}
    >
      <Tabs.Screen name="journal" />
      <Tabs.Screen name="files" />
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="bobee" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    height: 80,
    borderTopWidth: 1,
    borderColor: colors.lighter,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',  // move content up
    paddingTop: 12,                 // closer to top border
    position: 'relative',
  },
  // Short, centered “border-top”
  activeBar: {
    position: 'absolute',
    top: 0,
    right: '15%',
    height: 2,
    width: '70%',                  // not full width
    backgroundColor: colors.blue,                 // centers the bar (100 - 55) / 2
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: 'SpaceMono',
    marginTop: 4,
    color: colors.dark,            // stays black
    fontWeight: '400',
  },
  tabLabelActive: {
    fontFamily: 'SpaceMonoSemibold',
    color: colors.blue,            // bold when active
  },
});
