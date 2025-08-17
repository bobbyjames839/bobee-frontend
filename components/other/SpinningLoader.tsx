import React from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { colors } from '~/constants/Colors';

export default function SpinningLoader({ size = 48 }) {
  const spinAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.center}>
      <Animated.View
        style={[styles.spinner, { width: size, height: size, borderRadius: size / 2, transform: [{ rotate: spin }] }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    borderWidth: 5,
    borderColor: colors.blue,
    borderTopColor: colors.lightest,
    backgroundColor: 'transparent',
  },
});
