// components/ErrorBanner.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Dimensions } from 'react-native';

interface Props {
  message: string;
  onHide:   () => void;
}

export default function ErrorBanner({ message, onHide }: Props) {
  const CONTAINER_PADDING_TOP = 20; 
  const BANNER_HEIGHT         = 105;
  const EXTRA_OFFSET          = 20;
  const startY = -BANNER_HEIGHT - EXTRA_OFFSET - CONTAINER_PADDING_TOP;

  const slideTop = useRef(new Animated.Value(startY)).current;
  const { width } = Dimensions.get('window');

  useEffect(() => {
    if (!message) return;
    Animated.sequence([
      Animated.timing(slideTop, {
        toValue: 0,            // banner “top” === container’s inner top
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.delay(3000),
      Animated.timing(slideTop, {
        toValue: startY,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(onHide);
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { top: slideTop, width },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left:     0,
    height:   105,
    backgroundColor: '#E74C3C',
    zIndex:   1000,
    justifyContent: 'center',
    alignItems:     'center',
    paddingHorizontal: 12,
    paddingTop: 60,
    paddingBottom: 15
  },
  text: {
    color:    '#fff',
    fontSize: 14,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    flexWrap: 'wrap',  
    width: '100%',
  },
});
