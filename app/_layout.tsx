import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Buffer } from 'buffer';
if (!(global as any).Buffer) (global as any).Buffer = Buffer;
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  View,
  AppState,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
import { Asset } from 'expo-asset';

import { auth } from '../utils/firebase';
import { JournalRefreshProvider } from '../context/JournalRefreshContext';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import { JournalProvider } from '~/context/JournalContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

const API_URL: string | undefined =
  process.env.EXPO_PUBLIC_BACKEND_URL ??
  (Constants.expoConfig?.extra?.backendUrl as string | undefined);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/Poppins-Regular.ttf'),
    SpaceMonoBold: require('../assets/fonts/Poppins-SemiBold.ttf'),
    SpaceMonoSemibold: require('../assets/fonts/Poppins-Medium.ttf'),
    Lora: require('../assets/fonts/Lora-VariableFont_wght.ttf'),
  });

  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [bootDone, setBootDone] = useState(false);

  const [imageReady, setImageReady] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);

  const loaderOpacity = useRef(new Animated.Value(1)).current;

  const router = useRouter();
  const segments = useSegments();

  // preload bee image asap
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await Asset.loadAsync(require('../assets/images/happy.png'));
      } catch {}
      if (active) setImageReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Firebase auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  // server session check
  const serverSessionCheck = useMemo(
    () => async (): Promise<boolean> => {
      if (!auth.currentUser) return false;
      if (!API_URL) return true;
      const token = await auth.currentUser.getIdToken(true).catch(() => null);
      if (!token) return false;
      try {
        const res = await fetch(`${API_URL}/api/check-auth`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.ok;
      } catch {
        return true; // allow on network error
      }
    },
    []
  );

  const decideRoute = useMemo(
    () => async () => {
      const root = (segments?.[0] ?? '') as string;
      const inAuth = root === '(auth)';
  // Include tutorial so user can view intro page without immediate redirect
  const allowedWhenAuthed = new Set(['(tabs)', 'files', '(modals)', 'bobee', 'settings', 'journal', 'tutorial', 'insights']);

      if (!isLoggedIn) {
        if (!inAuth) router.replace('/(auth)/main');
        setBootDone(true);
        return;
      }

      const ok = await serverSessionCheck();
      if (!ok) {
        if (!inAuth) router.replace('/(auth)/main');
        setBootDone(true);
        return;
      }

      if (!allowedWhenAuthed.has(root)) {
        router.replace('/(tabs)/journal');
      }
      setBootDone(true);
    },
    [isLoggedIn, segments, router, serverSessionCheck]
  );

  useEffect(() => {
    if (authReady) decideRoute();
  }, [authReady, decideRoute]);

  // re-check on foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && authReady) {
        decideRoute();
      }
    });
    return () => sub.remove();
  }, [authReady, decideRoute]);

  const logicallyReady = fontsLoaded && authReady && bootDone;

  // fade the loader out (app is already rendered underneath)
  useEffect(() => {
    if (logicallyReady && imageReady && !loaderGone) {
      SplashScreen.hideAsync().catch(() => {});
      Animated.timing(loaderOpacity, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => setLoaderGone(true));
    }
  }, [logicallyReady, imageReady, loaderGone, loaderOpacity]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* App content (always mounted, visible) */}
      <SubscriptionProvider>
        <JournalRefreshProvider>
          <JournalProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                presentation: 'card',
                animation: 'none',          
                gestureEnabled: false,       
              }}
            >
              <Stack.Screen
                name="files"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                  gestureEnabled: true,
                  fullScreenGestureEnabled: true,
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="insights"
                options={{
                  presentation: 'card',
                  gestureEnabled: true,
                  animation: 'slide_from_right',
                }}
              />

              {/* other groups */}
              <Stack.Screen
                name="settings"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                  gestureEnabled: true,
                  fullScreenGestureEnabled: true,
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="journal"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                  gestureEnabled: true,
                  fullScreenGestureEnabled: true,
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="bobee"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                    gestureEnabled: false,
                    fullScreenGestureEnabled: false,
                  gestureDirection: 'horizontal',
                }}
              />
              <Stack.Screen name="(auth)" options={{ animation: 'none' }} />
              <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
            </Stack>
            <StatusBar style={Platform.OS === 'ios' ? 'dark' : 'auto'} />
          </JournalProvider>
        </JournalRefreshProvider>
      </SubscriptionProvider>

      {/* Loader overlay that fades out */}
      {!loaderGone && (
        <Animated.View style={[styles.loader, { opacity: loaderOpacity }]}>
          {imageReady && (
            <Image
              source={require('../assets/images/happy.png')}
              style={styles.image}
              resizeMode="contain"
              {...(Platform.OS === 'android' ? ({ fadeDuration: 0 } as any) : {})}
            />
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  image: {
    width: '60%',
    maxWidth: 300,
    aspectRatio: 1,
  },
});
