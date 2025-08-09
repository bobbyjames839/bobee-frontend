import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Dimensions } from 'react-native';

interface Props {
  message: string;
  onHide: () => void;
}

export default function ErrorBanner({ message, onHide }: Props) {
  const startY = -145;
  const slideTop = useRef(new Animated.Value(startY)).current;
  const { width } = Dimensions.get('window');

  useEffect(() => {
    if (!message) return;
    Animated.sequence([
      Animated.timing(slideTop, {
        toValue: 0,            
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
