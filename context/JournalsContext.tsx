import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { auth } from '~/utils/firebase';
import Constants from 'expo-constants';
import { useJournalRefresh } from './JournalRefreshContext';

export type JournalEntry = {
  id: string;
  transcript: string;
  createdAt: Timestamp;
  prompt?: string;
  aiResponse: {
    summary: string;
    moodScore: number;
    nextStep: string;
    feelings: string[];
    topic: string;
    thoughtPattern: string;
    selfInsight: string;
    personalityDeltas?: Record<string, number>;
  };
};

interface JournalsContextValue {
  journals: JournalEntry[];
  loading: boolean;
  fetchJournals: () => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
  recentThree: JournalEntry[];
}

const JournalsContext = createContext<JournalsContextValue | undefined>(undefined);

export const JournalsProvider = ({ children }: { children: React.ReactNode }) => {
  const { refreshKey, triggerRefresh } = useJournalRefresh();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string;

  const fetchJournals = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setJournals([]);
      return;
    }
    setLoading(true);
    try {
      const idToken = await user.getIdToken(true);
      const res = await fetch(`${API_BASE}/api/get-journals`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const raw: Array<Omit<JournalEntry, 'createdAt'> & { createdAt: string }> = await res.json();
      const entries = raw
        .map(e => ({ ...e, createdAt: Timestamp.fromDate(new Date(e.createdAt)) }))
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      console.log(`[JournalsProvider] fetched ${entries.length} journal${entries.length === 1 ? '' : 's'}`);
      setJournals(entries);
    } catch (e) {
      console.error('Failed to fetch journals:', e);
      setJournals([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  const deleteJournal = useCallback(async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const idToken = await user.getIdToken(true);
      const res = await fetch(`${API_BASE}/api/delete-journal/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      await fetchJournals();
      triggerRefresh(); // notify other consumers if needed
    } catch (e) {
      console.error('Error deleting journal:', e);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, fetchJournals, triggerRefresh]);

  // initial + refreshKey driven refetch (skip initial 0 -> only run once when we have a user)
  const uid = auth.currentUser?.uid;
  useEffect(() => {
    if (!uid) return;
    fetchJournals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  useEffect(() => {
    if (refreshKey > 0) {
      fetchJournals();
    }
  }, [refreshKey, fetchJournals]);

  const recentThree = useMemo(() => journals.slice(0, 3), [journals]);

  const value: JournalsContextValue = {
    journals,
    loading,
    fetchJournals,
    deleteJournal,
    recentThree,
  };

  return <JournalsContext.Provider value={value}>{children}</JournalsContext.Provider>;
};

export function useJournalsData() {
  const ctx = useContext(JournalsContext);
  if (!ctx) throw new Error('useJournalsData must be used within JournalsProvider');
  return ctx;
}
