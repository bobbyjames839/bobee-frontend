// context/JournalRefreshContext.tsx
import React, { createContext, useContext, useState } from 'react';

type JournalRefreshContextType = {
  refreshKey: number;
  triggerRefresh: () => void;
};

// Create a context with a default "shape."
const JournalRefreshContext = createContext<JournalRefreshContextType>({
  refreshKey: 0,
  triggerRefresh: () => {},
});

export const JournalRefreshProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  return (
    <JournalRefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </JournalRefreshContext.Provider>
  );
};

export const useJournalRefresh = () => useContext(JournalRefreshContext);
