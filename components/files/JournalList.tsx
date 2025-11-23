import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { JournalEntry } from '~/hooks/useFiles';
import JournalCard from './JournalCard';
import { colors } from '~/constants/Colors';
import useJournals from '~/hooks/useFiles';
import DeleteConfirmModal from '~/components/other/DeleteConfirmModal';
import * as Haptics from 'expo-haptics';


interface Props {
  journals: JournalEntry[];
  onSelect: (j: JournalEntry) => void;
  onDeleteSuccess?: (deletedId: string) => void;
  showSuccessMessage?: (message: string) => void;
}

const JournalList: React.FC<Props> = ({ journals, onSelect, onDeleteSuccess, showSuccessMessage }) => {
  const router = useRouter();
  const { deleteJournal } = useJournals();
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteJournal(id, !onDeleteSuccess);
      onDeleteSuccess?.(id);
      showSuccessMessage?.('Journal deleted successfully');
      setDeleteConfirmId(null);
    } catch (e) {
      console.error('Delete failed:', e);
    } finally {
      setIsDeleting(false);
    }
  };

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
    <>
      <View style={{ paddingBottom: 90 }}>
        {journals.map((entry) => (
          <JournalCard
            key={entry.id}
            entry={entry}
            onPress={() => onSelect(entry)}
            onLongPressDelete={() => {                      
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              setDeleteConfirmId(entry.id)
            }}
          />
        ))}
      </View>

      <DeleteConfirmModal
        visible={!!deleteConfirmId}
        title="Delete Journal?"
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        isDeleting={isDeleting}
      />
    </>
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
