// Hook that uses the JournalsContext
import { useJournalsData, JournalEntry } from '~/context/JournalsContext';

export type { JournalEntry };

export default function useJournals() {
  return useJournalsData();
}
