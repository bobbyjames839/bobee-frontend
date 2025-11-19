import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '~/utils/firebase';
import Constants from 'expo-constants';

interface BobeeContextValue {
  lastMessageAt: number | null;
  suggestions: string[] | null;
  microChallenge: string | null;
  reflectionQuestion: string | null;
  reflectionOptions: { text: string }[] | null;
  reflectionDoneToday: boolean;
  loading: boolean;
  error: string | null;
  markReflectionComplete: () => void;
  markMessageSent: () => void;
}

const BobeeContext = createContext<BobeeContextValue | undefined>(undefined);

export const BobeeProvider = ({ children }: { children: React.ReactNode }) => {
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [microChallenge, setMicroChallenge] = useState<string | null>(null);
  const [reflectionQuestion, setReflectionQuestion] = useState<string | null>(null);
  const [reflectionOptions, setReflectionOptions] = useState<{ text: string }[] | null>(null);
  const [reflectionDoneToday, setReflectionDoneToday] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string;

  const fetchBobeeData = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setLastMessageAt(null);
      setSuggestions(null);
      setMicroChallenge(null);
      setReflectionQuestion(null);
      setReflectionOptions(null);
      setReflectionDoneToday(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();

      // Fetch both message meta and insights in parallel
      const [metaRes, insightsRes] = await Promise.all([
        fetch(`${API_BASE}/api/bobee-message-meta`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/ai-insights`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (metaRes.ok) {
        const metaData = (await metaRes.json()) as { lastBobeeMessage: number | null };
        setLastMessageAt(metaData.lastBobeeMessage ?? null);
      }

      if (insightsRes.ok) {
        const insightsData = (await insightsRes.json()) as {
          suggestions: string[];
          microChallenge: string | null;
          reflectionQuestion: string | null;
          reflectionOptions?: { text: string }[];
          reflectionCompleted?: boolean;
        };
        setSuggestions(insightsData.suggestions || []);
        setMicroChallenge(insightsData.microChallenge || null);
        setReflectionQuestion(insightsData.reflectionQuestion || null);
        setReflectionOptions(Array.isArray(insightsData.reflectionOptions) ? insightsData.reflectionOptions : []);
        setReflectionDoneToday(!!insightsData.reflectionCompleted);
      } else {
        throw new Error('Failed to fetch insights');
      }

      console.log('[BobeeProvider] Bobee data fetched successfully');
    } catch (err) {
      console.error('Failed fetching Bobee data:', err);
      setError('Could not load insights');
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  // Initialize data on app load when user is authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('[BobeeProvider] User authenticated, fetching Bobee data on app load');
        fetchBobeeData();
      } else {
        // Clear data when user logs out
        setLastMessageAt(null);
        setSuggestions(null);
        setMicroChallenge(null);
        setReflectionQuestion(null);
        setReflectionOptions(null);
        setReflectionDoneToday(false);
      }
    });
    
    return () => unsubscribe();
  }, [fetchBobeeData]);

  const markReflectionComplete = useCallback(() => {
    setReflectionDoneToday(true);
  }, []);

  const markMessageSent = useCallback(() => {
    setLastMessageAt(Date.now());
  }, []);

  const value: BobeeContextValue = {
    lastMessageAt,
    suggestions,
    microChallenge,
    reflectionQuestion,
    reflectionOptions,
    reflectionDoneToday,
    loading,
    error,
    markReflectionComplete,
    markMessageSent
  };

  return <BobeeContext.Provider value={value}>{children}</BobeeContext.Provider>;
};

export function useBobeeData() {
  const ctx = useContext(BobeeContext);
  if (!ctx) throw new Error('useBobeeData must be used within BobeeProvider');
  return ctx;
}
