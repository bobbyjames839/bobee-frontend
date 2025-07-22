// app/_layout.tsx
import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { JournalRefreshProvider } from '../context/JournalRefreshContext';
import { SubscriptionProvider } from '../context/SubscriptionContext';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!authReady) return;
    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/(auth)/main');
    } else if (isLoggedIn && !inTabsGroup) {
      router.replace('/(tabs)/journal');
    }
  }, [authReady, isLoggedIn, segments]);

  if (!fontsLoaded || !authReady) return null;

  return (
    <SubscriptionProvider>
      <JournalRefreshProvider>
        <Slot />
        <StatusBar style="auto" />
      </JournalRefreshProvider>
    </SubscriptionProvider>
  );
}
