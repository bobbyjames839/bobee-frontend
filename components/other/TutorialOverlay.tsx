import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
} from 'react-native';
import { colors } from '~/constants/Colors';

interface TutorialOverlayProps {
  step: number; // 1–5
  total: number;
  title: string;
  description: string;
  onNext: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  onAfterHide?: () => void;
}

export default function TutorialOverlay({
  step,
  total,
  title,
  description,
  onNext,
  onSkip,
  nextLabel,
  onAfterHide,
}: TutorialOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const [exiting, setExiting] = useState(false);

  // entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 14,
        stiffness: 160,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 16,
        stiffness: 180,
        mass: 0.6,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, scale]);

  const runExit = useCallback(
    (cb: () => void) => {
      if (exiting) return;
      setExiting(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -15,
          duration: 180,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.94,
          duration: 180,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        cb();
        onAfterHide?.();
      });
    },
    [exiting, opacity, translateY, scale, onAfterHide]
  );

  const handleNext = () => runExit(onNext);
  const handleSkip = () => {
    if (onSkip) runExit(onSkip);
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      hardwareAccelerated
    >
      <View style={styles.backdrop} />
      <View style={styles.centerWrap} pointerEvents="box-none">
        <Animated.View
          style={[styles.card, { opacity, transform: [{ translateY }, { scale }] }]}
        >
          <Text style={styles.step}>{`Step ${step} of ${total}`}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <TouchableOpacity
            style={styles.nextBtn}
            onPress={handleNext}
            activeOpacity={0.85}
            disabled={exiting}
          >
            <Text style={styles.nextText}>
              {nextLabel || (step === total ? 'Finish' : 'Next')}
            </Text>
          </TouchableOpacity>

          {onSkip && step < total && (
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkip}
              activeOpacity={0.7}
              disabled={exiting}
            >
              <Text style={styles.skipText}>Skip tutorial</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.lighter,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  step: {
    fontSize: 13,
    color: colors.blue,
    fontFamily: 'SpaceMono',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontFamily: 'SpaceMonoSemibold',
    fontWeight: '600',
    color: colors.darkest,
    marginBottom: 8,
    alignSelf: 'center',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'SpaceMono',
    color: colors.darkest,
    marginBottom: 20,
    textAlign: 'center',
  },
  nextBtn: {
    backgroundColor: colors.blue,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    color: 'white',
    fontSize: 17,
    fontFamily: 'SpaceMono',
    fontWeight: '600',
  },
  skipBtn: { marginTop: 16, alignSelf: 'center' },
  skipText: {
    color: colors.dark,
    textDecorationLine: 'underline',
    fontFamily: 'SpaceMono',
  },
});
