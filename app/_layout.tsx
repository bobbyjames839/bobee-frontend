// app/_layout.tsx
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator, AppState } from 'react-native';
import { auth } from '../utils/firebase';
import { JournalRefreshProvider } from '../context/JournalRefreshContext';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import { colors } from '../constants/Colors';
import Constants from 'expo-constants';

SplashScreen.preventAutoHideAsync().catch(() => {});

if (!__DEV__) {
  const prev = (global as any).ErrorUtils?.getGlobalHandler?.();
  (global as any).ErrorUtils?.setGlobalHandler?.((e: any, isFatal?: boolean) => {
    console.log('JS fatal:', isFatal, e?.message, e?.stack);
    prev && prev(e, isFatal);
  });
}

const API_URL = Constants.expoConfig?.extra?.backendUrl as string;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/Lora-VariableFont_wght.ttf'),
  });

  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [bootDone, setBootDone] = useState(false);

  const segments = useSegments(); // e.g. ['files','[id]'] or ['(tabs)','journal']
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  const decideRoute = async () => {
    const root = (segments[0] ?? '') as string; // treat as plain string
    const inAuth = root === '(auth)';
    const inTabs = root === '(tabs)';
    const inFiles = root === 'files'; // detail stack outside tabs

    if (!isLoggedIn) {
      if (!inAuth) router.replace('/(auth)/main');
      setBootDone(true);
      return;
    }

    // optional server session check
    try {
      const token = await auth.currentUser?.getIdToken(false);
      const res = await fetch(`${API_URL}/api/check-auth`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (!inAuth) router.replace('/(auth)/main');
        setBootDone(true);
        return;
      }
    } catch {
      if (!inAuth) router.replace('/(auth)/main');
      setBootDone(true);
      return;
    }

    // allow staying on tabs or files when logged in; otherwise push to default tab
    if (!(inTabs || inFiles)) {
      router.replace('/(tabs)/journal');
    }
    setBootDone(true);
  };

  // run once per auth readiness change (don’t fight normal navigation)
  useEffect(() => {
    if (!authReady) return;
    decideRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, isLoggedIn]);

  // optional: re-check on foreground without yanking user away
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && authReady) {
        decideRoute();
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, isLoggedIn]);

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
        <Stack
          screenOptions={{
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            fullScreenGestureEnabled: true, // iOS full-screen swipe
          }}
        >
          {/* auth flow */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          {/* tabs (files list lives here as app/(tabs)/files.tsx) */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* files group outside tabs (e.g., app/files/[id].tsx) */}
          <Stack.Screen name="(modals)" options={{ headerShown: false }} />
        </Stack>

        <StatusBar style="auto" />
      </JournalRefreshProvider>
    </SubscriptionProvider>
  );
}
