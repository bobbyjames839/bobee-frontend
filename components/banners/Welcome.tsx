import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Dimensions, View } from 'react-native';
import { colors } from '~/constants/Colors';
import { auth } from '~/utils/firebase';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function WelcomeBanner({ visible, onClose }: Props) {
  const startY = -145;
  const slideTop = useRef(new Animated.Value(startY)).current;
  const { width } = Dimensions.get('window');
  const displayName = auth.currentUser?.displayName || auth.currentUser?.email || 'User';

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (visible) {
      Animated.timing(slideTop, {
        toValue: 0,
        duration: 600,
        useNativeDriver: false,
      }).start();

      timer = setTimeout(() => {
        Animated.timing(slideTop, {
          toValue: startY,
          duration: 600,
          useNativeDriver: false,
        }).start(() => onClose());
      }, 4000);
    } else {
      Animated.timing(slideTop, {
        toValue: startY,
        duration: 600,
        useNativeDriver: false,
      }).start();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.banner, { top: slideTop, width }]}>
      <View style={styles.centerContent}>
        <Text style={styles.text}>Signed in as {displayName}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 0,
    height: 105,
    backgroundColor: colors.blue,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 60,
    paddingBottom: 15,
  },
  centerContent: {
    width: '100%',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
});
