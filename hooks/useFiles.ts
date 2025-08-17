import { useState, useEffect, useMemo, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import { auth } from '~/utils/firebase';
import { useJournalRefresh } from '~/context/JournalRefreshContext';
import Constants from 'expo-constants';

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
  };
};

export default function useJournals() {
  const { refreshKey, triggerRefresh } = useJournalRefresh();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string;

  const fetchJournals = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const idToken = await user.getIdToken(true);
      const res = await fetch(`${API_BASE}/api/get-journals`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (!res.ok) throw new Error(`Server error: ${res.statusText}`);

      const raw: Array<Omit<JournalEntry, 'createdAt'> & { createdAt: string }> =
        await res.json();

      const entries = raw
        .map((e) => ({
          ...e,
          createdAt: Timestamp.fromDate(new Date(e.createdAt)),
        }))
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

      setJournals(entries);
    } catch (err) {
      console.error('Failed to fetch journals:', err);
      setJournals([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  const deleteJournal = useCallback(
    async (id: string) => {
      const user = auth.currentUser;
      if (!user) return;

      setLoading(true);
      try {
        const idToken = await user.getIdToken(true);
        const res = await fetch(`${API_BASE}/api/delete-journal/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
        });
        if (!res.ok) throw new Error(`Server error: ${res.statusText}`);

        await fetchJournals();
        triggerRefresh();
      } catch (err) {
        console.error('Error deleting journal:', err);
      } finally {
        setLoading(false);
      }
    },
    [API_BASE, fetchJournals, triggerRefresh]
  );

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals, refreshKey]);

  const recentThree = useMemo(() => journals.slice(0, 3), [journals]);

  return {
    journals,
    loading,
    fetchJournals,
    deleteJournal,
    recentThree,
  };
}
