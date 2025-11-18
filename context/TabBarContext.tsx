import React, { createContext, useContext, useState, useCallback } from 'react';

interface TabBarContextValue {
  isTabBarVisible: boolean;
  showTabBar: () => void;
  hideTabBar: () => void;
}

const TabBarContext = createContext<TabBarContextValue | undefined>(undefined);

export const TabBarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);

  const showTabBar = useCallback(() => {
    setIsTabBarVisible(true);
  }, []);

  const hideTabBar = useCallback(() => {
    setIsTabBarVisible(false);
  }, []);

  return (
    <TabBarContext.Provider value={{ isTabBarVisible, showTabBar, hideTabBar }}>
      {children}
    </TabBarContext.Provider>
  );
};

export const useTabBar = () => {
  const context = useContext(TabBarContext);
  if (!context) {
    throw new Error('useTabBar must be used within TabBarProvider');
  }
  return context;
};
