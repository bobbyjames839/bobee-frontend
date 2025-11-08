import { useCallback, useMemo, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { auth } from '~/utils/firebase';
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
    personalityDeltas?: Record<string, number>;
  };
};

interface UseJournalsResult {
  journals: JournalEntry[];
  loading: boolean;
  fetchJournals: () => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
  recentThree: JournalEntry[];
  dailyMoods: Record<string, number>;
  fetchJournalsByDate: (date: string) => Promise<JournalEntry[]>;
}

export default function useJournals(): UseJournalsResult {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [dailyMoods, setDailyMoods] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
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
      // Fetch only 3 most recent journals
      const res = await fetch(`${API_BASE}/api/get-journals?limit=3`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const raw: Array<Omit<JournalEntry, 'createdAt'> & { createdAt: string }> = await res.json();
      const entries = raw
        .map(e => ({ ...e, createdAt: Timestamp.fromDate(new Date(e.createdAt)) }))
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      console.log(`[useJournals] fetched ${entries.length} journal${entries.length === 1 ? '' : 's'}`);
      setJournals(entries);

      // Fetch daily moods
      const moodsRes = await fetch(`${API_BASE}/api/get-daily-moods`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      });
      if (moodsRes.ok) {
        const moodsData = await moodsRes.json();
        setDailyMoods(moodsData.dailyMoods || {});
      }
    } catch (e) {
      console.error('Failed to fetch journals:', e);
      setJournals([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  const fetchJournalsByDate = useCallback(async (date: string): Promise<JournalEntry[]> => {
    const user = auth.currentUser;
    if (!user) return [];
    
    try {
      const idToken = await user.getIdToken(true);
      const res = await fetch(`${API_BASE}/api/get-journals-by-date?date=${date}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const raw: Array<Omit<JournalEntry, 'createdAt'> & { createdAt: string }> = await res.json();
      const entries = raw
        .map(e => ({ ...e, createdAt: Timestamp.fromDate(new Date(e.createdAt)) }))
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      return entries;
    } catch (e) {
      console.error('Failed to fetch journals by date:', e);
      return [];
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
    } catch (e) {
      console.error('Error deleting journal:', e);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, fetchJournals]);

  const recentThree = useMemo(() => journals.slice(0, 3), [journals]);

  return {
    journals,
    loading,
    fetchJournals,
    deleteJournal,
    recentThree,
    dailyMoods,
    fetchJournalsByDate,
  };
}
