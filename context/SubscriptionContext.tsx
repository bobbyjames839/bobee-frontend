import { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import Constants from 'expo-constants';
import { auth } from '../utils/firebase';

export type SubContextType = {
  isSubscribed: boolean | null;
  refresh: () => void;
};

export const SubscriptionContext = createContext<SubContextType>({
  isSubscribed: null,
  refresh: () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const API_BASE = (Constants.expoConfig?.extra?.backendUrl || '').toString();

  const fetchStatus = async () => {
    const user = auth.currentUser;
    if (!user) {
  setIsSubscribed(null);
      return;
    }
    try {
      const idToken = await user.getIdToken(false);
  const resp = await fetch(`${API_BASE}/api/subscribe/unified-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Failed to load status');
  setIsSubscribed(typeof data?.isSubscribed === 'boolean' ? data.isSubscribed : false);
    } catch (e) {
  setIsSubscribed(false);
    }
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, () => {
      fetchStatus();
    });
    return () => {
      unsubAuth();
    };
  }, [API_BASE]);

  return (
  <SubscriptionContext.Provider value={{ isSubscribed, refresh: fetchStatus }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
