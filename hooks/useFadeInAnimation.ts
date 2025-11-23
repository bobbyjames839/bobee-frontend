import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useNavigation } from '@react-navigation/native';

export function useFadeInAnimation(slideDistance: number = 30, duration: number = 400) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  
  // Track the previous tab index to detect actual tab switches
  const getTabIndex = useCallback(() => {
    try {
      const parent = navigation.getParent();
      return parent?.getState()?.index ?? 0;
    } catch {
      return 0;
    }
  }, [navigation]);
  
  const currentTabIndex = useRef(getTabIndex());
  const isReturningFromPush = useRef(false);

  useFocusEffect(
    useCallback(() => {
      const newTabIndex = getTabIndex();
      const isTabSwitch = newTabIndex !== currentTabIndex.current;
      
      // Only animate if it's a real tab switch (not returning from a pushed screen)
      if (isTabSwitch && !isReturningFromPush.current) {
        // Reset animations
        fadeAnim.setValue(0);
        slideAnim.setValue(slideDistance);
        
        // Animate in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ]).start();
      }
      
      // Update the previous tab index
      currentTabIndex.current = newTabIndex;
      
      // Reset the flag
      isReturningFromPush.current = false;
      
      // Cleanup: mark that we might be pushing
      return () => {
        isReturningFromPush.current = true;
      };
    }, [fadeAnim, slideAnim, slideDistance, duration, getTabIndex])
  );

  return { fadeAnim, slideAnim };
}
