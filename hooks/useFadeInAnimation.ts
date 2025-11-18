import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useNavigationState } from '@react-navigation/native';

export function useFadeInAnimation(slideDistance: number = 30, duration: number = 400) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Track the previous route index to detect tab switches vs back navigation
  const currentIndex = useNavigationState(state => state?.index);
  const previousIndex = useRef(currentIndex);
  const isReturningFromPush = useRef(false);

  useFocusEffect(
    useCallback(() => {
      // Detect if we're returning from a pushed screen
      // If the tab index changed, it's a tab switch - always animate
      // If we're marked as returning from push, don't animate
      const isTabSwitch = currentIndex !== previousIndex.current;
      
      if (isTabSwitch || !isReturningFromPush.current) {
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
      
      // Update the previous index
      previousIndex.current = currentIndex;
      
      // Reset the flag
      isReturningFromPush.current = false;
      
      // Cleanup: mark that we might be pushing
      return () => {
        isReturningFromPush.current = true;
      };
    }, [fadeAnim, slideAnim, slideDistance, duration, currentIndex])
  );

  return { fadeAnim, slideAnim };
}
