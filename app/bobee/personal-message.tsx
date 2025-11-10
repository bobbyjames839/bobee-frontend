import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Animated, Easing } from "react-native";
import { Audio, AVPlaybackStatusSuccess } from "expo-av";
import * as FileSystem from "expo-file-system";
import { colors } from "~/constants/Colors";
import Header from "~/components/other/Header";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import Constants from "expo-constants";

// Backend HTTP base
const extraCfg = (Constants.expoConfig?.extra as any) || {};
const API_BASE: string | undefined = (extraCfg.backendUrl as string | undefined)?.replace(/\/$/, "");

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

export default function PersonalMessageScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showFinishUI, setShowFinishUI] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Single-sound; HTTP request lifecycle
  const soundRef = useRef<Audio.Sound | null>(null);
  const inFlightRef = useRef(false);

  // ---- Animations (unchanged) ----
  const baseR = 90;
  const rTL = useRef(new Animated.Value(baseR)).current;
  const rTR = useRef(new Animated.Value(baseR)).current;
  const rBR = useRef(new Animated.Value(baseR)).current;
  const rBL = useRef(new Animated.Value(baseR)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const scaleY = useRef(new Animated.Value(1)).current;
  const rotateZ = useRef(new Animated.Value(0)).current;
  const ghostOpacity = useRef(new Animated.Value(0)).current;
  const ghostOffsetX = useRef(new Animated.Value(0)).current;
  const ghostOffsetY = useRef(new Animated.Value(0)).current;
  const ghostScale = useRef(new Animated.Value(1.06)).current;
  const phase = useRef(new Animated.Value(0)).current;
  const bubbleOpacity = useRef(new Animated.Value(1)).current;
  const loadingPulse = useRef(new Animated.Value(0)).current;
  const finishOpacity = useRef(new Animated.Value(0)).current;
  const blobActiveRef = useRef(false);
  const lightenOpacity = phase.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0] });
  const rotateStr = rotateZ.interpolate({ inputRange: [-180, 180], outputRange: ["-180deg", "180deg"] });

  const animateValue = (v: Animated.Value, to: number, duration: number) =>
    Animated.timing(v, { toValue: to, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: false });
  const animateTransformValue = (v: Animated.Value, to: number, duration: number) =>
    Animated.timing(v, { toValue: to, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: false });

  const scheduleMorph = useCallback((mode: "idle" | "speaking") => {
    if (!blobActiveRef.current) return;
    const amp = mode === "speaking" ? 26 : 14;
    const sAmp = mode === "speaking" ? 0.08 : 0.035;
    const rotAmp = mode === "speaking" ? 5 : 2.5;
    const dur = mode === "speaking" ? rand(900, 1400) : rand(1400, 2200);
    Animated.parallel([
      animateValue(rTL, baseR + rand(-amp, amp), dur),
      animateValue(rTR, baseR + rand(-amp, amp), dur),
      animateValue(rBR, baseR + rand(-amp, amp), dur),
      animateValue(rBL, baseR + rand(-amp, amp), dur),
      animateTransformValue(scaleX, 1 + rand(-sAmp, sAmp), dur),
      animateTransformValue(scaleY, 1 + rand(-sAmp, sAmp), dur),
      animateTransformValue(rotateZ, rand(-rotAmp, rotAmp), dur),
      animateTransformValue(ghostOffsetX, mode === "speaking" ? rand(-6, 6) : 0, dur),
      animateTransformValue(ghostOffsetY, mode === "speaking" ? rand(-6, 6) : 0, dur),
      animateTransformValue(ghostScale, mode === "speaking" ? rand(1.05, 1.11) : 1.04, dur),
      animateValue(ghostOpacity, mode === "speaking" ? rand(0.14, 0.22) : 0, dur),
      animateValue(phase, mode === "speaking" ? 1 : 0, Math.max(320, dur * 0.6)),
    ]).start(({ finished }) => { if (finished && blobActiveRef.current) scheduleMorph(mode); });
  }, [rTL, rTR, rBR, rBL, scaleX, scaleY, rotateZ, ghostOffsetX, ghostOffsetY, ghostScale, ghostOpacity, phase]);

  const startBlob = useCallback((mode: "idle" | "speaking") => {
    blobActiveRef.current = true;
    if (mode === "idle") {
      loadingPulse.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(loadingPulse, { toValue: 1, duration: 900, useNativeDriver: false, easing: Easing.inOut(Easing.quad) }),
          Animated.timing(loadingPulse, { toValue: 0, duration: 900, useNativeDriver: false, easing: Easing.inOut(Easing.quad) }),
        ])
      ).start();
      scheduleMorph("idle");
    } else {
      scheduleMorph("speaking");
    }
  }, [scheduleMorph]);

  const stopBlob = useCallback(() => {
    blobActiveRef.current = false;
    Animated.parallel([
      animateValue(rTL, baseR, 240),
      animateValue(rTR, baseR, 240),
      animateValue(rBR, baseR, 240),
      animateValue(rBL, baseR, 240),
      animateTransformValue(scaleX, 1, 240),
      animateTransformValue(scaleY, 1, 240),
      animateTransformValue(rotateZ, 0, 240),
      animateTransformValue(ghostOffsetX, 0, 240),
      animateTransformValue(ghostOffsetY, 0, 240),
      animateTransformValue(ghostScale, 1.06, 240),
      animateValue(ghostOpacity, 0, 200),
      animateValue(phase, 0, 200),
    ]).start();
  }, [rTL, rTR, rBR, rBL, scaleX, scaleY, rotateZ, ghostOffsetX, ghostOffsetY, ghostScale, ghostOpacity, phase]);

  // ---- Single-file playback helpers ----
  const unloadCurrent = useCallback(async () => {
    if (soundRef.current) {
      try { await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
  }, []);

  const playBase64File = useCallback(async (b64: string, mime?: string, extHint?: string) => {
    const ext =
      (extHint && /^[a-z0-9]+$/i.test(extHint)) ? extHint :
      mime === "audio/wav" ? "wav" :
      mime === "audio/mpeg" ? "mp3" : "mp3";

    const fileUri = `${FileSystem.cacheDirectory}bobee_message.${ext}`;
    await FileSystem.writeAsStringAsync(fileUri, b64, { encoding: FileSystem.EncodingType.Base64 });

    // switch UI
    setLoading(false);
    setSpeaking(true);
    setFinished(false);
    setShowFinishUI(false);

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        interruptionModeIOS: (Audio as any).INTERRUPTION_MODE_IOS_DO_NOT_MIX ?? 2,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (e) {
      console.log('[personal-message] setAudioModeAsync error', e);
      // continue; not fatal for playback typically
    }

    await unloadCurrent();

    const { sound } = await Audio.Sound.createAsync({ uri: fileUri }, { shouldPlay: true });
    soundRef.current = sound;
    sound.setOnPlaybackStatusUpdate((st) => {
      const s = st as AVPlaybackStatusSuccess;
      if (s.isLoaded && s.didJustFinish) {
        setSpeaking(false);
        setFinished(true);
      }
    });
  }, [unloadCurrent]);

  // ---- HTTP session (single request) ----
  const startSession = useCallback(async () => {
    setError(null);
    setLoading(true);
    setSpeaking(false);
    setFinished(false);
    setShowFinishUI(false);
    try {
      if (!API_BASE) { setError("Missing backendUrl in app config"); setLoading(false); return; }
      const user = getAuth().currentUser;
      if (!user) { setError("Not signed in"); setLoading(false); return; }
      const token = await user.getIdToken();
      if (inFlightRef.current) return; // prevent duplicate
      inFlightRef.current = true;
      const resp = await fetch(`${API_BASE}/api/bobee-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.error || `request-failed-${resp.status}`);
      }
      const json = await resp.json();
      if (json?.audio?.b64) {
        await playBase64File(json.audio.b64, json.audio.mime, json.audio.ext);
      } else {
        throw new Error('missing-audio');
      }
    } catch (e: any) {
      setError(e?.message || "Failed to start session");
      setLoading(false);
    } finally {
      inFlightRef.current = false;
    }
  }, [playBase64File]);

  useEffect(() => {
    console.log('starting session');
    startSession();
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync();
      inFlightRef.current = false;
    };
  }, [startSession]);

  const onRefresh = useCallback(async () => {
    console.log('refreshing');
    setRefreshing(true);
    try {
      try { await unloadCurrent(); } catch {}
      await startSession();
    } finally {
      setRefreshing(false);
    }
  }, [startSession, unloadCurrent]);

  useEffect(() => {
    if (loading) { startBlob("idle"); return; }
    if (speaking) { startBlob("speaking"); return; }
    if (finished) {
      Animated.parallel([
        Animated.timing(bubbleOpacity, { toValue: 0, duration: 600, useNativeDriver: false, easing: Easing.out(Easing.quad) }),
        Animated.timing(ghostOpacity, { toValue: 0, duration: 600, useNativeDriver: false }),
      ]).start(() => {
        stopBlob();
        setShowFinishUI(true);
        finishOpacity.setValue(0);
        Animated.timing(finishOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
      });
    }
  }, [loading, speaking, finished, startBlob, stopBlob, bubbleOpacity, ghostOpacity, finishOpacity]);

  // --- UI ---
  return (
    <>
      <Header title="Personal message" />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {error && <Text style={[styles.meta, styles.error]}>{error}</Text>}

        <View style={styles.centerOuter}>
          {!showFinishUI && (
            <>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.bubbleGlow,
                  {
                    opacity: ghostOpacity,
                    transform: [
                      { translateX: ghostOffsetX },
                      { translateY: ghostOffsetY },
                      { scale: ghostScale },
                      { rotate: rotateStr },
                    ],
                    borderTopLeftRadius: rTL,
                    borderTopRightRadius: rTR,
                    borderBottomRightRadius: rBR,
                    borderBottomLeftRadius: rBL,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.bubble,
                  {
                    transform: [
                      { scaleX },
                      { scaleY },
                      { rotate: rotateStr },
                      ...(loading
                        ? [{ scale: loadingPulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] }) }]
                        : []),
                    ],
                    borderTopLeftRadius: rTL,
                    borderTopRightRadius: rTR,
                    borderBottomRightRadius: rBR,
                    borderBottomLeftRadius: rBL,
                    opacity: bubbleOpacity,
                  },
                ]}
              >
                <Animated.View style={[styles.lighten, { opacity: lightenOpacity }]} />
              </Animated.View>
            </>
          )}

          {showFinishUI && (
            <Animated.View style={[styles.finishSectionCentered, { opacity: finishOpacity }]}>
              <Text style={styles.finishHeading}>Reflection complete</Text>
              <Text style={styles.finishNote}>Come back tomorrow for a fresh personal reflection.</Text>
              <Pressable style={styles.finishBtn} onPress={() => router.replace("/(tabs)/bobee")}>
                <Text style={styles.finishBtnText}>Back to main page</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </>
  );
}


const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.lightest, flexGrow: 1 },
  centerOuter: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, width: '100%', position: 'relative', paddingBottom: 80 },

  // Main bubble: dark blue; appears lighter during loading via the white overlay below
  bubble: {
    width: 200, height: 200,
    backgroundColor: colors.blue,
    overflow: 'hidden',
    opacity: 0.95,
  },
  messageScroll: { position: 'absolute', top: 10, left: 10, right: 10, bottom: 10 },
  messageScrollContent: { paddingBottom: 12 },
  messageText: { color: '#fff', fontSize: 12, lineHeight: 16, fontFamily: 'SpaceMono', opacity: 0.95 },

  // Subtle faded aura while speaking (no “border” look, no shadow)
  bubbleGlow: {
    width: 240, height: 240,
    backgroundColor: 'rgba(0,0,80,0.07)', // subtle faded background dedicated to bubble
    position: 'absolute',
    shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 12 }, shadowRadius: 28,
  },

  // White overlay to visually lighten the bubble during loading
  lighten: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFFFFF',
  },

  primaryBtn: { marginTop: 24, backgroundColor: colors.blue, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontFamily: 'SpaceMono', fontSize: 16, fontWeight: '600' },
  finishBtn: { marginTop: 40, backgroundColor: colors.blue, paddingVertical: 14, paddingHorizontal: 42, borderRadius: 50, alignItems: 'center', shadowColor: colors.blue, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 8 }, shadowRadius: 24 },
  finishBtnText: { color: '#fff', fontFamily: 'SpaceMono', fontSize: 18, fontWeight: '600', letterSpacing: 0.8 },
  finishSection: { marginTop: 34, alignItems: 'center', paddingHorizontal: 16 },
  finishSectionCentered: { position: 'absolute', top: '50%', left: '50%', width: 300, marginLeft: -150, marginTop: -120, alignItems: 'center', paddingHorizontal: 16 },
  finishHeading: { fontSize: 22, fontWeight: '600', color: colors.dark, fontFamily: 'SpaceMonoBold', marginBottom: 10 },
  finishNote: { fontSize: 13, color: colors.dark, opacity: 0.75, fontFamily: 'SpaceMono', textAlign: 'center', lineHeight: 18, maxWidth: 260 },

  meta: { fontSize: 14, color: colors.dark, fontFamily: 'SpaceMono', marginBottom: 12 },
  error: { color: 'crimson' },
  note: { marginTop: 14, fontSize: 12, color: colors.dark, opacity: 0.7, fontFamily: 'SpaceMono' }
})
