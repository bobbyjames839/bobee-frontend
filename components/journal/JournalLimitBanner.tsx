import React, { useEffect, useRef, useContext } from 'react';
import { Animated, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '~/constants/Colors';
import { SubscriptionContext } from '~/context/SubscriptionContext';

interface Props {
  visible: boolean;
}

export default function JournalLimitBanner({ visible }: Props) {
  const router = useRouter();
  const { isSubscribed } = useContext(SubscriptionContext);
  const HIDDEN_Y = -220;
  const slideAnim = useRef(new Animated.Value(visible ? 0 : HIDDEN_Y)).current;
  const hasMounted = useRef(false);
  const bannerText = isSubscribed
    ? "You've reached your daily journalling limit. Come back tomorrow!"
    : "You've reached your daily free journalling limit. Upgrade to Pro for more time.";

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    Animated.timing(slideAnim, {
      toValue: visible ? 0 : HIDDEN_Y,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.banner,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={styles.text}>{bannerText}</Text>
      {!isSubscribed && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(tabs)/settings/sub')}
        >
          <Text style={styles.buttonText}>Upgrade Now</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF5F5',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FFCCCC',
    zIndex: 10,
  },
  text: {
    fontFamily: 'SpaceMono',
    color: '#D32F2F',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.blue,
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  buttonText: {
    fontFamily: 'SpaceMono',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
