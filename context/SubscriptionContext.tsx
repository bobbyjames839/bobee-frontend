import { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import Constants from 'expo-constants';
import { auth } from '../utils/firebase';

export type SubContextType = {
  isSubscribed: boolean | null;
  cancelDate: number | false | null;
};

export const SubscriptionContext = createContext<SubContextType>({
  isSubscribed: null,
  cancelDate: null,
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [cancelDate, setCancelDate] = useState<number | false | null>(null);

  const API_BASE = (Constants.expoConfig?.extra?.backendUrl || '').toString();

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      const user = auth.currentUser;
      if (!user) {
        if (!isMounted) return;
        setIsSubscribed(null);
        setCancelDate(null);
        return;
      }
      try {
        const idToken = await user.getIdToken(false);
        const resp = await fetch(`${API_BASE}/api/subscribe/status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data?.error || 'Failed to load status');

        if (!isMounted) return;
        setIsSubscribed(
          typeof data?.isSubscribed === 'boolean' ? data.isSubscribed : false
        );
        setCancelDate(
          typeof data?.cancelDate === 'number' ? data.cancelDate : false
        );
      } catch (e) {
        if (!isMounted) return;
        // On error, keep auth-known state but clear values
        setIsSubscribed(false);
        setCancelDate(false);
      }
    };

    const unsubAuth = onAuthStateChanged(auth, () => {
      // whenever auth changes, refresh from backend
      fetchStatus();
    });

    return () => {
      isMounted = false;
      unsubAuth();
    };
  }, [API_BASE]);

  return (
    <SubscriptionContext.Provider value={{ isSubscribed, cancelDate }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
