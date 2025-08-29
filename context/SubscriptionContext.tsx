import { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
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
  // We now treat the entire app as "Pro" / subscribed. All subscription
  // checks collapse to true, and no backend call is made. We still watch
  // auth state so we can reset to true once a user object exists (or null while
  // auth is determining). If you want to remove the transient null state,
  // initialize to true directly and skip auth listener.
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(true);

  const fetchStatus = () => {
    // Previously fetched from backend; now forced true.
    setIsSubscribed(true);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {
      // Regardless of user / anon, mark as subscribed.
      setIsSubscribed(true);
    });
    return () => unsub();
  }, []);

  return (
  <SubscriptionContext.Provider value={{ isSubscribed, refresh: fetchStatus }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
