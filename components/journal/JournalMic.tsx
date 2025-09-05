import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, Text, View, StyleSheet, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MicrophoneStage, X } from 'phosphor-react-native';
import { colors } from '~/constants/Colors';

interface JournalMicProps {
  isRecording: boolean;
  loading: boolean;
  timer: number;
  prompt: string;
  onToggle: () => void;
  onGenerate: () => void;
  onClearPrompt: () => void;
  pulseAnim: Animated.Value; // kept for compatibility though no longer used
}

export default function JournalMic({
  isRecording,
  loading,
  timer,
  prompt,
  onToggle,
  onGenerate,
  onClearPrompt,
  pulseAnim, // eslint-disable-line @typescript-eslint/no-unused-vars
}: JournalMicProps) {
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Transition animation between idle (0) and recording (1)
  const transAnim = useRef(new Animated.Value(isRecording ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(transAnim, {
      toValue: isRecording ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isRecording, transAnim]);

  const micScale = transAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.83] });
  const micTranslateY = transAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const micOpacity = transAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1] });

  return (
    <>
      <TouchableOpacity onPress={onToggle} disabled={loading} activeOpacity={0.9}>
        <Animated.View
          style={[
            styles.micShadowWrapper,
            !isRecording && loading && { opacity: 0.4 },
            {
              transform: [
                { translateY: micTranslateY },
                { scale: micScale },
              ],
              opacity: micOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={['#ded0ffff', '#f1f1f1ff']}
            locations={[0, 0.6]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.gradientCircle]}
          >
            <MicrophoneStage size={72} color={colors.blue} />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {isRecording && <VoiceWave />}
      {isRecording && <Text style={styles.timer}>{formatTime(timer)}</Text>}
      {!isRecording && !loading && <Text style={styles.hint}>Click to speak</Text>}

      {!loading && !isRecording && (
        <View style={styles.promptControlsRow}>
          <TouchableOpacity
            onPress={onGenerate}
            style={[styles.promptButton, prompt.length > 0 && styles.promptButtonActive]}
          >
            <Text style={styles.promptButtonText}>
              {prompt ? 'Regenerate Prompt' : 'Generate Prompt'}
            </Text>
          </TouchableOpacity>
          {prompt.length > 0 && (
            <TouchableOpacity onPress={onClearPrompt} style={styles.clearPromptButton}>
              <X size={20} color={colors.lightest} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );
}

// Full-width uniform bar waveform
function VoiceWave() {
  // Reverted: independent looping scale for each bar (uniform base height) with slight duration variance.
  const screenWidth = Dimensions.get('window').width;
  const horizontalPadding = 40;
  const barWidth = 5;
  const gap = 6;
  const usableWidth = screenWidth - horizontalPadding;
  const barCount = Math.max(12, Math.floor((usableWidth + gap) / (barWidth + gap)));
  const anims = useRef([...Array(barCount)].map(() => new Animated.Value(Math.random()))).current;

  useEffect(() => {
    const loops = anims.map((val) => {
      const base = 320 + Math.random() * 280; // random cycle
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration: base, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: base * 0.8, useNativeDriver: true }),
        ])
      );
      loop.start();
      return loop;
    });
    return () => loops.forEach(l => l.stop());
  }, [anims]);

  return (
    <View style={[styles.waveLineContainer, { paddingHorizontal: horizontalPadding / 2 }]}> 
      {anims.map((v, i) => {
        const scaleY = v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
        const t = i / (barCount - 1);
        const r = 15 + Math.round(35 * t);
        const g = 80 + Math.round(90 * t);
        const b = 210 + Math.round(25 * (1 - t));
        return (
          <Animated.View
            key={i}
            style={[
              styles.waveLineBar,
              {
                width: barWidth,
                marginLeft: i === 0 ? 0 : gap,
                height: 44,
                transform: [{ scaleY }],
                backgroundColor: `rgb(${r},${g},${b})`,
                opacity: 0.75,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  micShadowWrapper: {
    borderRadius: 999,
    shadowColor: colors.blue,
    shadowOpacity: 0.6,
    shadowRadius: 15,

  },
  gradientCircle: {
    borderRadius: 999,
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientCircleRecording: {},
  micRecordingPosition: {},
  timer: {
    marginTop: 32,
    letterSpacing: 3.5,
    fontSize: 20,
    fontFamily: 'SpaceMono',
    borderWidth: 1,
    borderColor: colors.lighter,
    borderRadius: 12,
    textAlign: 'center',
    width: 100,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  hint: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
    color: '#999',
    fontFamily: 'SpaceMono',
  },
  promptControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  promptButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 80,
    height: 50,
    display: 'flex',
    justifyContent: 'center',
    borderRadius: 18,
    marginTop: 26,
  },
  promptButtonText: {
    color: colors.lightest,
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
  clearPromptButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 14,
    height: 50,
    display: 'flex',
    justifyContent: 'center',
    borderRadius: 18,
    marginTop: 26,
  },
  promptButtonActive: {
    paddingHorizontal: 45,
  },
  waveLineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 40,
    width: '100%',
  },
  waveLineBar: {
    borderRadius: 3,
  },
});
