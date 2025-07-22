import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';

const loadingMessages = [
  'Transcribing your journal.',
  'Understanding your emotions.',
  'Getting AI response.',
];

export default function JournalLoading({
  loading,
  loadingStage,
}: {
  loading: boolean;
  loadingStage: number;
}) {
  if (!loading) return null;
  return (
    <View style={styles.loadingMessageContainer}>
      {loadingMessages.map((msg, index) =>
        loadingStage > index ? (
          <View key={index} style={styles.loadingRow}>
            <View
              style={[
                styles.loadingTextWrapper,
                index < loadingStage - 1 && styles.completedLoadingText,
              ]}
            >
              {index < loadingStage - 1 && (
                <Check size={18} color="black" style={styles.tickIcon} />
              )}
              <Text style={styles.loadingText}>{msg}</Text>
            </View>
          </View>
        ) : null
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingMessageContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  loadingRow: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  loadingTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#F0F0F0',
  },
  completedLoadingText: {
    backgroundColor: '#C7F6C7',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'SpaceMono',
    color: '#222',
  },
  tickIcon: {
    marginRight: 8,
  },
});
