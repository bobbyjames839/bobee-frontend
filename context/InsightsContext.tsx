import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '~/utils/firebase';
import Constants from 'expo-constants';

type Stats = {
  totalWords: number;
  totalEntries: number;
  currentStreak: number;
  avgMoodLast3Days: number | null;
  hourlyHistogram?: number[];
};

interface MoodSeries { 
  labels: string[]; 
  values: Array<number | null>;
}

type RangeKey = '7d' | '28d';
type SeriesResponse = Record<RangeKey, MoodSeries>;
type PersonalityKey = 'resilience' | 'discipline' | 'focus' | 'selfWorth' | 'confidence' | 'clarity';
type PersonalityStats = Record<PersonalityKey, { value: number; delta: number }>;
type Topic = { topic: string; count: number };

interface InsightsContextValue {
  stats: Stats | null;
  moodSeries: SeriesResponse;
  personality: PersonalityStats | null;
  topics: Topic[] | null;
  loading: boolean;
  fetchInsights: () => Promise<void>;
}

const InsightsContext = createContext<InsightsContextValue | undefined>(undefined);

export const InsightsProvider = ({ children }: { children: React.ReactNode }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [moodSeries, setMoodSeries] = useState<SeriesResponse>({
    '7d': { labels: [], values: [] },
    '28d': { labels: [], values: [] },
  });
  const [personality, setPersonality] = useState<PersonalityStats | null>(null);
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [loading, setLoading] = useState(false);
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string;

  const fetchInsights = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setStats(null);
      setMoodSeries({ '7d': { labels: [], values: [] }, '28d': { labels: [], values: [] } });
      setPersonality(null);
      setTopics([]);
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();

      const [statsRes, moodRes, personalityRes, topicsRes] = await Promise.all([
        fetch(`${API_BASE}/api/habit-cards-stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/mood-chart-stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/personality-stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/topics`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!statsRes.ok) throw new Error(`HabitCards HTTP ${statsRes.status}`);
      if (!moodRes.ok) throw new Error(`MoodChart HTTP ${moodRes.status}`);
      if (!personalityRes.ok) throw new Error(`Personality HTTP ${personalityRes.status}`);
      if (!topicsRes.ok) throw new Error(`Topics HTTP ${topicsRes.status}`);

      const statsData = (await statsRes.json()) as Stats;
      const moodData = (await moodRes.json()) as SeriesResponse;
      const personalityData = (await personalityRes.json()) as { personalityStats: PersonalityStats };
      const topicsData = (await topicsRes.json()) as { topics: Topic[] };

      setStats(statsData);
      setMoodSeries(moodData);
      setPersonality(personalityData.personalityStats);
      setTopics(topicsData.topics ?? []);
      
      console.log('[InsightsProvider] Insights data fetched successfully');
    } catch (e) {
      console.error('Failed fetching insights:', e);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  // Initialize data on app load when user is authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('[InsightsProvider] User authenticated, fetching insights on app load');
        fetchInsights();
      } else {
        // Clear data when user logs out
        setStats(null);
        setMoodSeries({ '7d': { labels: [], values: [] }, '28d': { labels: [], values: [] } });
        setPersonality(null);
        setTopics([]);
      }
    });
    
    return () => unsubscribe();
  }, [fetchInsights]);

  const value: InsightsContextValue = {
    stats,
    moodSeries,
    personality,
    topics,
    loading,
    fetchInsights,
  };

  return <InsightsContext.Provider value={value}>{children}</InsightsContext.Provider>;
};

export function useInsightsData() {
  const ctx = useContext(InsightsContext);
  if (!ctx) throw new Error('useInsightsData must be used within InsightsProvider');
  return ctx;
}
