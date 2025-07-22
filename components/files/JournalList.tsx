// components/files/JournalList.tsx
import React from 'react';
import { View } from 'react-native';
import { JournalEntry } from '~/hooks/useFiles';
import JournalCard from './JournalCard';

interface Props {
  journals: JournalEntry[];
  onSelect: (j: JournalEntry) => void;
}

const JournalList: React.FC<Props> = ({ journals, onSelect }) => (
  <View>
    {journals.map((entry) => (
      <JournalCard
        key={entry.id}
        entry={entry}
        onPress={() => onSelect(entry)}
      />
    ))}
  </View>
);

export default JournalList;
