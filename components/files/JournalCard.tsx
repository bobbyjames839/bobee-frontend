// components/files/JournalCard.tsx
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { JournalEntry } from '~/hooks/useFiles';

interface Props {
  entry: JournalEntry;
  onPress: () => void;
}

const formatDate = (ts: Date | { toDate: () => Date }) =>
  (ts instanceof Date ? ts : ts.toDate()).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const getMoodIcon = (score: number) => {
  if (score <= 3) return { name: 'sentiment-very-dissatisfied', color: '#E74C3C' };
  if (score <= 6) return { name: 'sentiment-neutral', color: '#F1C40F' };
  return { name: 'sentiment-very-satisfied', color: '#2ECC71' };
};

const JournalCard: React.FC<Props> = ({ entry, onPress }) => {
  const mood = getMoodIcon(entry.aiResponse.moodScore);
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.card}>
        <MaterialIcons
          name={mood.name as any}
          size={24}
          color={mood.color}
          style={styles.moodIcon}
        />
        <Text style={styles.date}>{formatDate(entry.createdAt)}</Text>
        <Text style={styles.text} numberOfLines={2}>
          {entry.transcript}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  moodIcon: { position: 'absolute', top: 12, right: 16 },
  date: { fontSize: 14, color: '#666', marginBottom: 8, fontFamily: 'SpaceMono' },
  text: { fontSize: 16, color: '#222', lineHeight: 22, fontFamily: 'SpaceMono' },
});

export default JournalCard;
