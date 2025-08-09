import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { JournalRefreshProvider } from '../context/JournalRefreshContext';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import Constants from 'expo-constants'

const API_URL = Constants.expoConfig?.extra?.backendUrl as string

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf') });
  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  // Listen for Firebase auth state changes (client-side only)
  // - Runs once on mount
  // - Sets isLoggedIn = true if a user is signed in
  // - Marks authReady so the next effect can run
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  // 2) Route guard with backend verification
  // - Waits until Firebase auth state is known (authReady)
  // - If not logged in → redirect to auth stack
  // - If logged in → get Firebase ID token and call backend /api/session
  // - Backend checks token validity; if invalid → redirect to auth
  // - If valid → redirect into tabs stack
  useEffect(() => {
    if (!authReady) return;
    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isLoggedIn) {
      if (!inAuthGroup) router.replace('/(auth)/main');
      return;
    }

    (async () => {
      const token = await auth.currentUser?.getIdToken(false);
      const res = await fetch(`${API_URL}/api/check-auth`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error('Session check failed:', await res.text())
        if (!inAuthGroup) router.replace('/(auth)/main');
        return;
      }
      if (!inTabsGroup) router.replace('/(tabs)/journal');
    })();
  }, [authReady, isLoggedIn, segments, router]);

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
