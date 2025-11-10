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
  // All logged-in users are subscribed (enforced at login/signup)
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);

  const fetchStatus = () => {
    // If user is logged in, they're subscribed
    setIsSubscribed(!!auth.currentUser);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      // User logged in = subscribed, user logged out = not subscribed
      setIsSubscribed(!!user);
    });
    return () => unsub();
  }, []);

  return (
  <SubscriptionContext.Provider value={{ isSubscribed, refresh: fetchStatus }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
