import React from 'react';
import { Tabs } from 'expo-router';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutChangeEvent,
  Text,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Plus, Calendar, Sparkles, Bot, ChevronDown, AlignEndHorizontal } from 'lucide-react-native';
import { colors } from '~/constants/Colors';
import { useJournalContext } from '~/context/JournalContext';

type IconType = React.ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

const TABS = {
  insights: { Icon: AlignEndHorizontal as IconType },
  bobee: { Icon: Sparkles as IconType },
  journal: { Icon: Plus as IconType },
  chat: { Icon: Bot as IconType },
  files: { Icon: Calendar as IconType },
} as const;

type TabKey = keyof typeof TABS;

const DOT_SIZE = 5;

// Single tab button with icon colour fade
function TabButton(props: {
  routeKey: string;
  isFocused: boolean;
  isJournalTab: boolean;
  Icon: IconType;
  onPress: () => void;
  onLongPress: () => void;
  index: number;
  onCenterX: (index: number, centerX: number) => void;
}) {
  const { isFocused, isJournalTab, Icon, onPress, onLongPress, index, onCenterX } =
    props;

  const focusAnim = React.useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isFocused, focusAnim]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    const centerX = x + width / 2;
    onCenterX(index, centerX);
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      activeOpacity={0.8}
      onLayout={handleLayout}
    >
      {isJournalTab ? (
        <View style={styles.journalButton}>
          <Icon color="white" size={24} strokeWidth={2} />
        </View>
      ) : (
        <View style={styles.iconContainer}>
          {/* Focused (blue) icon */}
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              { alignItems: 'center', justifyContent: 'center', opacity: focusAnim },
            ]}
          >
            <Icon color={colors.blue} size={24} strokeWidth={2} />
          </Animated.View>

          {/* Unfocused (grey) icon */}
          <Animated.View
            style={{
              opacity: focusAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            }}
          >
            <Icon color="#abababff" size={24} strokeWidth={2} />
          </Animated.View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function MyTabBar({ state, navigation }: BottomTabBarProps) {
  const journal = useJournalContext();
  const { isTabBarVisible, hideTabBar } = useTabBar();
  const isFullscreen = journal.isRecording || journal.loading;
  const isChatPage = state.routes[state.index]?.name === 'chat';

  const indicatorX = React.useRef(new Animated.Value(0)).current;
  const indicatorOpacity = React.useRef(new Animated.Value(0)).current;
  const tabBarTranslateY = React.useRef(new Animated.Value(0)).current;
  const centersRef = React.useRef<number[]>([]);

  const journalIndex = state.routes.findIndex((r) => r.name === 'journal');

  const setCenterX = (index: number, centerX: number) => {
    centersRef.current[index] = centerX;
  };

  // Animate the indicator when the active tab changes
  React.useEffect(() => {
    const currentIndex = state.index;

    // Hide dot if we're on the journal tab or no center yet
    const currentCenter = centersRef.current[currentIndex];
    if (currentIndex === journalIndex || currentCenter == null) {
      Animated.timing(indicatorOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
      return;
    }

    const targetX = currentCenter - DOT_SIZE / 2;

    Animated.parallel([
      Animated.timing(indicatorX, {
        toValue: targetX,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(indicatorOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [state.index, journalIndex, indicatorX, indicatorOpacity]);

  // Hide tab bar when on chat page or when explicitly hidden
  React.useEffect(() => {
    const shouldHide = isChatPage && !isTabBarVisible;
    Animated.timing(tabBarTranslateY, {
      toValue: shouldHide ? 85 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isChatPage, isTabBarVisible, tabBarTranslateY]);

  if (isFullscreen) return null;

  return (
    <Animated.View style={[styles.tabBar, { transform: [{ translateY: tabBarTranslateY }] }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const name = route.name as TabKey;
        const isJournalTab = name === 'journal';
        const config = TABS[name];
        const Icon = (config?.Icon ?? Plus) as IconType;

        const onPress = () => {
          // Haptics on every tab press
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

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
          <TabButton
            key={route.key}
            routeKey={route.key}
            isFocused={isFocused}
            isJournalTab={isJournalTab}
            Icon={Icon}
            onPress={onPress}
            onLongPress={onLongPress}
            index={index}
            onCenterX={setCenterX}
          />
        );
      })}

      {/* Animated dot indicator for non-journal tabs */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.indicator,
          {
            opacity: indicatorOpacity,
            transform: [{ translateX: indicatorX }],
          },
        ]}
      />

      {/* Hide button when tab bar is visible on chat page */}
      {isChatPage && isTabBarVisible && (
        <TouchableOpacity 
          style={styles.tabBarHide} 
          onPress={hideTabBar}
          activeOpacity={0.8}
        >
          <ChevronDown size={23} color={colors.blue} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

import { TabBarProvider, useTabBar } from '~/context/TabBarContext';

export default function TabLayout() {
  return (
    <TabBarProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
        }}
        tabBar={(props) => <MyTabBar {...props} />}
      >
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="bobee" />
      <Tabs.Screen name="journal" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="files" />
      </Tabs>
    </TabBarProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'white',
    height: 75,
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
    paddingHorizontal: 13,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 16,
    position: 'relative',
  },
  iconContainer: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journalButton: {
    position: 'absolute',
    top: -8,
    width: 60,
    height: 60,
    borderRadius: 23,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    left: '50%',
    marginLeft: -30, // half width to center
  },
  indicator: {
    position: 'absolute',
    bottom: 18, // closer to icons, not glued to the very bottom
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.blue,
  },
  tabBarHide: {
    position: "absolute",
    bottom: 63,
    left: 50,
    backgroundColor: "white",
    borderRadius: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.lighter,
  },
});
