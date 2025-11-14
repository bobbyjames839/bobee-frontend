import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, Text, View, StyleSheet, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MicrophoneStage, X, StarFour } from 'phosphor-react-native';
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
  pulseAnim, 
}: JournalMicProps) {
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

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

  return (
    <>
      <TouchableOpacity onPress={onToggle} disabled={loading} activeOpacity={0.9}>
        <Animated.View
          style={[
            styles.micShadowWrapper,
            {
              transform: [
                { translateY: micTranslateY },
                { scale: micScale },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#ded0ff', '#f1f1f1']}
            locations={[0, 0.6]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.micCircle}
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
            style={prompt ? styles.promptButtonWrapper : styles.promptButtonWrapperEmpty}
          >
            <LinearGradient
              colors={[colors.blue, '#737befff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={prompt ? styles.promptButton : styles.promptButtonEmpty}
            >
              <View style={styles.promptContent}>
                <StarFour size={20} weight="fill" color={colors.lightest} />
                <Text style={styles.promptButtonText}>
                  {prompt ? 'Regenerate Prompt' : 'Generate Prompt'}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
          {prompt.length > 0 && (
            <TouchableOpacity onPress={onClearPrompt} style={styles.clearPromptButtonWrapper}>
              <LinearGradient
                colors={['#737befff', colors.blue]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.clearPromptButton}
              >
                <X size={24} color={colors.lightest} weight="bold" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );
}

// Full-width uniform bar waveform
function VoiceWave() {
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
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 4, height: 4 },
  },
  micCircle: {
    borderRadius: 999,
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
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
    marginTop: 30,
    gap: 2,
  },
  promptButtonWrapper: {
    borderRadius: 45,
    borderBottomRightRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
  },
  promptButtonWrapperEmpty : {
    borderRadius: 45,
    overflow: 'hidden',
  },
  promptButton: {
    paddingHorizontal: 20,
    height: 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptButtonEmpty: {
    paddingHorizontal: 50,
    height: 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promptButtonText: {
    color: colors.lightest,
    fontSize: 18,
    fontFamily: 'SpaceMonoSemibold',
  },
  clearPromptButtonWrapper: {
    borderRadius: 45,
    borderBottomLeftRadius: 0,
    borderTopLeftRadius: 0,
    overflow: 'hidden',
  },
  clearPromptButton: {
    paddingHorizontal: 15,
    height: 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
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
