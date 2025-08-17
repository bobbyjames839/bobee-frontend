// context/JournalContext.tsx
import React, { createContext, useContext } from 'react';
import { useJournalRecording } from '~/hooks/useJournals';

const JournalContext = createContext<ReturnType<typeof useJournalRecording> | null>(null);

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const journal = useJournalRecording();
  return (
    <JournalContext.Provider value={journal}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournalContext() {
  const ctx = useContext(JournalContext);
  if (!ctx) {
    throw new Error('useJournalContext must be used within a JournalProvider');
  }
  return ctx;
}
