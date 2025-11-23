import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
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

interface JournalsContextValue {
  journals: JournalEntry[];
  loading: boolean;
  fetchJournals: () => Promise<void>;
  fetchMoods: () => Promise<void>;
  deleteJournal: (id: string, shouldRefetch?: boolean) => Promise<void>;
  recentThree: JournalEntry[];
  dailyMoods: Record<string, number>;
  fetchJournalsByDate: (date: string) => Promise<JournalEntry[]>;
  getJournalById: (id: string) => JournalEntry | undefined;
  entriesForDay: JournalEntry[];
  setEntriesForDay: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
}

const JournalsContext = createContext<JournalsContextValue | undefined>(undefined);

export const JournalsProvider = ({ children }: { children: React.ReactNode }) => {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [dailyMoods, setDailyMoods] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [allLoadedJournals, setAllLoadedJournals] = useState<Map<string, JournalEntry>>(new Map());
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string;
  const [entriesForDay, setEntriesForDay] = React.useState<JournalEntry[]>([]);
  

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
      console.log(`[JournalsProvider] fetched ${entries.length} journal${entries.length === 1 ? '' : 's'}`);
      setJournals(entries);
      
      // Cache these journals
      setAllLoadedJournals(prev => {
        const updated = new Map(prev);
        entries.forEach(entry => updated.set(entry.id, entry));
        return updated;
      })
    } catch (e) {
      console.error('Failed to fetch journals:', e);
      setJournals([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  const fetchMoods = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setDailyMoods({});
      return;
    }
    const idToken = await user.getIdToken(true);
    const moodsRes = await fetch(`${API_BASE}/api/get-daily-moods`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    });
    if (moodsRes.ok) {
      const moodsData = await moodsRes.json();
      setDailyMoods(moodsData.dailyMoods || {});
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
      
      // Cache these journals
      setAllLoadedJournals(prev => {
        const updated = new Map(prev);
        entries.forEach(entry => updated.set(entry.id, entry));
        return updated;
      });
      
      return entries;
    } catch (e) {
      console.error('Failed to fetch journals by date:', e);
      return [];
    }
  }, [API_BASE]);

  const deleteJournal = useCallback(async (id: string, shouldRefetch: boolean = true) => {
    const user = auth.currentUser;
    if (!user) return;
    
    // Check if the journal being deleted is in the recent 3
    const isInRecentThree = journals.some(j => j.id === id);
    
    setLoading(true);
    try {
      const idToken = await user.getIdToken(true);
      const res = await fetch(`${API_BASE}/api/delete-journal/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      
      // Remove from cache
      setAllLoadedJournals(prev => {
        const updated = new Map(prev);
        updated.delete(id);
        return updated;
      });
      
      setJournals(prev => prev.filter(j => j.id !== id));
      setEntriesForDay((prev) => prev.filter((entry) => entry.id !== id));

      if (shouldRefetch && isInRecentThree) {
        await fetchJournals();
      }
    } catch (e) {
      console.error('Error deleting journal:', e);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, fetchJournals, journals]);

  const recentThree = useMemo(() => journals.slice(0, 3), [journals]);

  const getJournalById = useCallback((id: string): JournalEntry | undefined => {
    // First check in current journals array
    const inCurrent = journals.find(j => j.id === id);
    if (inCurrent) return inCurrent;
    
    // Then check in cache
    return allLoadedJournals.get(id);
  }, [journals, allLoadedJournals]);

  // Initialize data on app load when user is authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('[JournalsProvider] User authenticated, fetching journals and moods on app load');
        fetchJournals();
        fetchMoods();
      } else {
        // Clear data when user logs out
        setJournals([]);
        setDailyMoods({});
      }
    });
    
    return () => unsubscribe();
  }, [fetchJournals, fetchMoods]);

  const value: JournalsContextValue = {
    journals,
    loading,
    fetchJournals,
    fetchMoods,
    deleteJournal,
    recentThree,
    dailyMoods,
    fetchJournalsByDate,
    getJournalById,
    entriesForDay,
    setEntriesForDay,
  };

  return <JournalsContext.Provider value={value}>{children}</JournalsContext.Provider>;
};

export function useJournalsData() {
  const ctx = useContext(JournalsContext);
  if (!ctx) throw new Error('useJournalsData must be used within JournalsProvider');
  return ctx;
}
