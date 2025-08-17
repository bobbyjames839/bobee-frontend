// app/_layout.tsx
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator, AppState } from 'react-native';
import Constants from 'expo-constants';

import { auth } from '../utils/firebase';
import { JournalRefreshProvider } from '../context/JournalRefreshContext';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import { colors } from '../constants/Colors';
import { JournalProvider } from '~/context/JournalContext';
SplashScreen.preventAutoHideAsync().catch(() => {});

if (!__DEV__) {
  const prev = (global as any).ErrorUtils?.getGlobalHandler?.();
  (global as any).ErrorUtils?.setGlobalHandler?.((e: any, isFatal?: boolean) => {
    console.log('JS fatal:', isFatal, e?.message, e?.stack);
    prev && prev(e, isFatal);
  });
}

// Prefer public env in Expo; fall back to app config extra
const API_URL: string | undefined =
  process.env.EXPO_PUBLIC_BACKEND_URL ??
  (Constants.expoConfig?.extra?.backendUrl as string | undefined);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/Lora-VariableFont_wght.ttf'),
  });

  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [bootDone, setBootDone] = useState(false);

  const router = useRouter();
  const segments = useSegments(); // e.g. ['(tabs)','journal'] or ['(auth)','main']
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Firebase auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  // Helper: tolerant server-side session check
  const serverSessionCheck = useMemo(
    () => async (): Promise<boolean> => {
      if (!auth.currentUser) return false;

      // If API_URL missing, don't boot the user out — allow local auth to stand
      if (!API_URL) {
        console.warn('API_URL not set; skipping server session check.');
        return true;
      }

      // Force fresh token once after login
      const token = await auth.currentUser.getIdToken(true).catch(() => null);
      if (!token) return false;

      try {
        const res = await fetch(`${API_URL}/api/check-auth`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        // Only treat explicit non-OK as "not authed"
        return res.ok;
      } catch (e) {
        console.warn('check-auth network error, allowing session:', e);
        // Network/CORS/offline should not kick user back to auth
        return true;
      }
    },
    []
  );

  const decideRoute = useMemo(
    () => async () => {
      const root = (segments?.[0] ?? '') as string;
      const inAuth = root === '(auth)';
      const allowedWhenAuthed = new Set(['(tabs)', 'files', '(modals)']);

      if (!isLoggedIn) {
        if (!inAuth) router.replace('/(auth)/main');
        if (mountedRef.current) setBootDone(true);
        return;
      }

      const ok = await serverSessionCheck();
      if (!ok) {
        if (!inAuth) router.replace('/(auth)/main');
        if (mountedRef.current) setBootDone(true);
        return;
      }

      if (!allowedWhenAuthed.has(root)) {
        router.replace('/(tabs)/journal');
      }

      if (mountedRef.current) setBootDone(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLoggedIn, segments]
  );

  // Run when auth becomes ready or login state changes
  useEffect(() => {
    if (!authReady) return;
    decideRoute();
  }, [authReady, decideRoute]);

  // Re-check on foreground, but don't eject user for transient errors
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && authReady) {
        decideRoute();
      }
    });
    return () => sub.remove();
  }, [authReady, decideRoute]);

  // Hide splash only when we’re truly ready to render
  useEffect(() => {
    if (fontsLoaded && authReady && bootDone) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, authReady, bootDone]);

  if (!fontsLoaded || !authReady || !bootDone) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={colors?.blue ?? '#4f50e3'} />
      </View>
    );
  }

  return (
    <SubscriptionProvider>
      <JournalRefreshProvider>
        <JournalProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              presentation: 'card',
              animation: 'slide_from_right',
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              fullScreenGestureEnabled: true,
            }}
          >
            {/* Auth group: /app/(auth)/... */}
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />

            {/* Main tabs: /app/(tabs)/... */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          </Stack>

          <StatusBar style="auto" />
        </JournalProvider>
      </JournalRefreshProvider>
    </SubscriptionProvider>
  );
}
