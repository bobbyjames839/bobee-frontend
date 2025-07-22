import React from 'react';
import { TouchableOpacity, Animated, Text, View, StyleSheet } from 'react-native';
import { Mic, X } from 'lucide-react-native';
import { colors } from '~/constants/Colors';

interface JournalMicProps {
  isRecording: boolean;
  loading: boolean;
  timer: number;
  prompt: string;
  onToggle: () => void;
  onGenerate: () => void;
  onClearPrompt: () => void;
  pulseAnim: Animated.Value;
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
  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <>
      <TouchableOpacity onPress={onToggle} disabled={loading} activeOpacity={0.9}>
        <Animated.View
          style={[
            styles.micWrapper,
            isRecording && {
              ...styles.micWrapperRecording,
              transform: [{ scale: pulseAnim }],
            },
            !isRecording && loading && { opacity: 0.4 },
          ]}
        >
          <Mic size={72} color={isRecording ? 'white' : colors.blue} />
        </Animated.View>
      </TouchableOpacity>

      {isRecording && <Text style={styles.timer}>{formatTime(timer)}</Text>}
      {!isRecording && !loading && <Text style={styles.hint}>Click to speak</Text>}

      {!loading && !isRecording && (
        <View style={styles.promptControlsRow}>
          <TouchableOpacity onPress={onGenerate} style={[
              styles.promptButton,
              prompt.length > 0 && styles.promptButtonActive,
            ]}>
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

const styles = StyleSheet.create({
  micWrapper: {
    backgroundColor: colors.lighter,
    borderRadius: 999,
    padding: 60,
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  micWrapperRecording: {
    backgroundColor: colors.blue,
  },
  timer: {
    marginTop: 32,
    fontSize: 20,
    fontFamily: 'SpaceMono',
    borderWidth: 1,
    borderColor: colors.lighter,
    borderRadius: 12,
    paddingHorizontal: 36,
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
    paddingVertical: 14,
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
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 26,
  },
  promptButtonActive: {
    paddingHorizontal: 45,
  },
});

