import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ScrollView, ImageSourcePropType } from 'react-native';
import { Check, Sparkles } from 'lucide-react-native';
import { colors } from '~/constants/Colors';

interface SignUpStep7PersonalizingProps {
  onComplete: () => void
}

const steps = [
  'Analyzing your goals.',
  'Tuning recommendations.',
  'Setting daily prompts.',
  'Configuring reminders.',
  'Personalising insights.',
  'Finalising...'
];

const PER_STEP_MS = 1200;

const AnimatedLoadingRow = ({
  msg,
  isCompleted,
  isActive,
}: {
  msg: string;
  isCompleted: boolean;
  isActive: boolean;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isActive) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(sparkleAnim, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isActive]);

  useEffect(() => {
    if (isCompleted) {
      Animated.timing(borderAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: false }).start();
    }
  }, [isCompleted]);

  const sparkleOpacity = sparkleAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5] });
  const sparkleScale = sparkleAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.2, 1] });
  const borderColor = borderAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(66, 135, 245, 0)', colors.blue] });

  return (
    <Animated.View style={[styles.loadingRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Animated.View style={[styles.loadingTextWrapper, isCompleted && { ...styles.completedLoadingText, borderColor }]}>
        {isCompleted ? (
          <Check size={18} color={colors.blue} style={styles.icon} />
        ) : isActive ? (
          <Animated.View style={{ opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] }}>
            <Sparkles size={18} color={colors.blue} style={styles.icon} />
          </Animated.View>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
        <Text style={styles.loadingText}>{msg}</Text>
      </Animated.View>
    </Animated.View>
  );
};

export default function SignUpStep7Personalizing({ onComplete }: SignUpStep7PersonalizingProps) {
  const [stage, setStage] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const beeScale = useRef(new Animated.Value(1)).current;

  // Pulsing animation for the bee
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(beeScale, { toValue: 1.15, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(beeScale, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    setStage(1);
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (stage === 0) return;
    if (stage < steps.length) {
      timeoutRef.current = setTimeout(() => setStage((s) => s + 1), PER_STEP_MS);
    } else {
      timeoutRef.current = setTimeout(onComplete, PER_STEP_MS);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [stage, onComplete]);


  return (
    <View style={styles.container}>
      <View style={styles.topTextWrap} pointerEvents="none">
        <Text style={styles.title}>Personalizing your experience</Text>
        <Text style={styles.subtitle}>We’re tailoring Bobee to help you reach your goals</Text>
      </View>

      <View style={styles.loadingMessageContainer}>
        {steps.map((msg, index) =>
          stage > index ? (
            <AnimatedLoadingRow
              key={index}
              msg={msg}
              isCompleted={index < stage - 1}
              isActive={index === stage - 1}
            />
          ) : null
        )}
      </View>

      {/* Pulsating Bee Image */}
      <Animated.Image
        source={require('~/assets/images/bee.png')}
        style={[
          styles.homeImage,
          { transform: [{ scale: beeScale }] }
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightest },
  topTextWrap: {
    position: 'absolute',
    top: 20,
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 2,
  },
  homeImage: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 120,
    height: 120,
    zIndex: 2,
  },
  title: { fontSize: 28, textAlign: 'center', fontFamily: 'SpaceMonoSemibold', color: colors.darkest, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.dark, textAlign: 'center', fontFamily: 'SpaceMono', lineHeight: 22, paddingHorizontal: 8 },
  loadingMessageContainer: { width: '84%', marginHorizontal: '8%', marginTop: '50%' },
  loadingRow: { width: '100%', alignItems: 'center', marginTop: 8 },
  loadingTextWrapper: { flexDirection: 'row', alignItems: 'center', height: 40, paddingHorizontal: 12, borderRadius: 12, width: '90%', backgroundColor: '#F0F0F0' },
  completedLoadingText: { borderWidth: 1 },
  loadingText: { fontSize: 16, fontFamily: 'SpaceMono', color: '#222', textAlign: 'left' },
  icon: { marginRight: 8 },
  iconPlaceholder: { width: 18, marginRight: 8 },
});
