import 'react-native-gesture-handler';
import 'react-native-reanimated';

import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
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
  const [navDone, setNavDone] = useState(false); 

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  const decideRoute = async () => {
    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isLoggedIn) {
      if (!inAuthGroup) router.replace('/(auth)/main');
      setNavDone(true);
      return;
    }

    const token = await auth.currentUser?.getIdToken(false);
    const res = await fetch(`${API_URL}/api/check-auth`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.log('Session check failed:', await res.text().catch(() => ''));
      if (!inAuthGroup) router.replace('/(auth)/main');
      setNavDone(true);
      return;
    }

    if (!inTabsGroup) router.replace('/(tabs)/journal');
    setNavDone(true);
  };

  useEffect(() => {
    if (!authReady) return;
    setNavDone(false);   
    decideRoute();
  }, [authReady, isLoggedIn]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && authReady) {
        setNavDone(false);
        decideRoute();
      }
    });
    return () => sub.remove();
  }, [authReady, isLoggedIn]);

  useEffect(() => {
    if (fontsLoaded && authReady && navDone) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, authReady, navDone]);

  if (!fontsLoaded || !authReady || !navDone) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={colors?.blue ?? '#4f50e3'} />
      </View>
    );
  }

  return (
    <SubscriptionProvider>
      <JournalRefreshProvider>
        <Slot />
        <StatusBar style="auto" />
      </JournalRefreshProvider>
    </SubscriptionProvider>
  );
}
