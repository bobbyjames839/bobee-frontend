import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { JournalEntry } from '~/hooks/useFiles';
import JournalCard from './JournalCard';
import { colors } from '~/constants/Colors';

interface Props {
  journals: JournalEntry[];
  onSelect: (j: JournalEntry) => void;
  onDeleteSuccess?: () => void;
}

const JournalList: React.FC<Props> = ({ journals, onSelect, onDeleteSuccess }) => {
  const router = useRouter();

  if (!journals || journals.length === 0) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/(tabs)/journal')}
        accessibilityRole="button"
        style={styles.emptyCard}
      >
        <Text style={styles.emptyTitle}>No journals yet</Text>
        <Text style={styles.emptySubtitle}>Tap to start your first entry</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View>
      {journals.map((entry) => (
        <JournalCard
          key={entry.id}
          entry={entry}
          onPress={() => onSelect(entry)}
          onDeleteSuccess={onDeleteSuccess}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyCard: {
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.lighter,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'SpaceMonoSemibold',
    color: colors.darkest,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
    color: colors.darkest,
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default JournalList;
