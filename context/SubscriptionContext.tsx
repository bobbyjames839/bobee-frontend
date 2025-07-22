// context/SubscriptionContext.tsx
import { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';

export type SubContextType = {
  /** null = auth not ready, boolean = subscription state */
  isSubscribed: boolean | null;
};

export const SubscriptionContext = createContext<SubContextType>({
  isSubscribed: null,
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);

  useEffect(() => {
    let unsubSnap: () => void;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid, 'metrics', 'userInfo');
        unsubSnap = onSnapshot(docRef, (snap) => {
          setIsSubscribed(snap.data()?.subscribed ?? false);
        });
      } else {
        setIsSubscribed(null);
        if (unsubSnap) unsubSnap();
      }
    });

    return () => {
      unsubAuth();
      if (unsubSnap) unsubSnap();
    };
  }, []);

  return (
    <SubscriptionContext.Provider value={{ isSubscribed }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
