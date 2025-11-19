import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ScrollView } from 'react-native';
import { Check, Sparkles } from 'lucide-react-native';
import { colors } from '~/constants/Colors';

const loadingMessages = [
  'Preparing analysis',
  'Reading your journal',
  'Reviewing thought patterns',
  'Assessing different emotions',
  'Generating response metrics',
  'Finalising'
];



const AnimatedLoadingRow = ({ msg, isCompleted, isActive }: { msg: string; isCompleted: boolean; isActive: boolean }) => {
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

export default function JournalLoading({ loading, loadingStage }: { loading: boolean; loadingStage: number }) {
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to the latest row when a new stage appears
  useEffect(() => {
    if (loading) {
      // wait a frame so newly mounted row has laid out
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [loadingStage, loading]);

  if (!loading) return null;

  return (
    <View style={styles.loadingMessageContainer}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={false}
      >
        {loadingMessages.map((msg, index) =>
          loadingStage > index ? (
            <AnimatedLoadingRow
              key={index}
              msg={msg}
              isCompleted={index < loadingStage - 1}
              isActive={index === loadingStage - 1}
            />
          ) : null
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingMessageContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 30,
    zIndex: 250,
  },
  // Set a maxHeight so once rows exceed this area, they become scrollable.
  // Adjust (e.g., 220–320) to fit your design.
  scroll: {
    height: 300,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  loadingRow: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    zIndex: 250,
  },
  loadingTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    width: 320,
    backgroundColor: '#F0F0F0',
  },
  completedLoadingText: {
    borderWidth: 1,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'SpaceMono',
    color: '#222',
    textAlign: 'left',
  },
  icon: {
    marginRight: 8,
  },
  iconPlaceholder: {
    width: 18,
    marginRight: 8,
  },
});
