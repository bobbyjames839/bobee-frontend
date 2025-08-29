// import React, { useEffect, useState, useRef, useCallback } from "react";
// import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Animated, Easing } from "react-native";
// import { colors } from "~/constants/Colors";
// import Header from "~/components/other/Header";
// import { Audio, AVPlaybackStatusSuccess } from "expo-av";
// import * as FileSystem from "expo-file-system";
// import { useRouter } from "expo-router";
// import { getAuth } from "firebase/auth";
// import Constants from "expo-constants";

// const API_BASE = Constants.expoConfig?.extra?.backendUrl as string;
// const rand = (min: number, max: number) => Math.random() * (max - min) + min;

// export default function PersonalMessageScreen() {
//   // UI state
//   const [loading, setLoading] = useState(true);
//   const [speaking, setSpeaking] = useState(false);
//   const [finished, setFinished] = useState(false);
//   const [showFinishUI, setShowFinishUI] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const router = useRouter();

//   // Audio
//   const soundRef = useRef<Audio.Sound | null>(null);

//   // Animations
//   const baseR = 90;
//   const rTL = useRef(new Animated.Value(baseR)).current;
//   const rTR = useRef(new Animated.Value(baseR)).current;
//   const rBR = useRef(new Animated.Value(baseR)).current;
//   const rBL = useRef(new Animated.Value(baseR)).current;
//   const scaleX = useRef(new Animated.Value(1)).current;
//   const scaleY = useRef(new Animated.Value(1)).current;
//   const rotateZ = useRef(new Animated.Value(0)).current;
//   const ghostOpacity = useRef(new Animated.Value(0)).current;
//   const ghostOffsetX = useRef(new Animated.Value(0)).current;
//   const ghostOffsetY = useRef(new Animated.Value(0)).current;
//   const ghostScale = useRef(new Animated.Value(1.06)).current;
//   const phase = useRef(new Animated.Value(0)).current;
//   const bubbleOpacity = useRef(new Animated.Value(1)).current;
//   const loadingPulse = useRef(new Animated.Value(0)).current;
//   const finishOpacity = useRef(new Animated.Value(0)).current;
//   const blobActiveRef = useRef(false);

//   const lightenOpacity = phase.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0] });
//   const rotateStr = rotateZ.interpolate({ inputRange: [-180, 180], outputRange: ["-180deg", "180deg"] });

//   // Anim helpers
//   const animateValue = (v: Animated.Value, to: number, duration: number) =>
//     Animated.timing(v, { toValue: to, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: false });
//   const animateTransformValue = (v: Animated.Value, to: number, duration: number) =>
//     Animated.timing(v, { toValue: to, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: false });

//   const scheduleMorph = useCallback(
//     (mode: "idle" | "speaking") => {
//       if (!blobActiveRef.current) return;
//       const amp = mode === "speaking" ? 26 : 14;
//       const sAmp = mode === "speaking" ? 0.08 : 0.035;
//       const rotAmp = mode === "speaking" ? 5 : 2.5;
//       const dur = mode === "speaking" ? rand(900, 1400) : rand(1400, 2200);
//       Animated.parallel([
//         animateValue(rTL, baseR + rand(-amp, amp), dur),
//         animateValue(rTR, baseR + rand(-amp, amp), dur),
//         animateValue(rBR, baseR + rand(-amp, amp), dur),
//         animateValue(rBL, baseR + rand(-amp, amp), dur),
//         animateTransformValue(scaleX, 1 + rand(-sAmp, sAmp), dur),
//         animateTransformValue(scaleY, 1 + rand(-sAmp, sAmp), dur),
//         animateTransformValue(rotateZ, rand(-rotAmp, rotAmp), dur),
//         animateTransformValue(ghostOffsetX, mode === "speaking" ? rand(-6, 6) : 0, dur),
//         animateTransformValue(ghostOffsetY, mode === "speaking" ? rand(-6, 6) : 0, dur),
//         animateTransformValue(ghostScale, mode === "speaking" ? rand(1.05, 1.11) : 1.04, dur),
//         animateValue(ghostOpacity, mode === "speaking" ? rand(0.14, 0.22) : 0, dur),
//         animateValue(phase, mode === "speaking" ? 1 : 0, Math.max(320, dur * 0.6)),
//       ]).start(({ finished }) => {
//         if (finished && blobActiveRef.current) scheduleMorph(mode);
//       });
//     },
//     [rTL, rTR, rBR, rBL, scaleX, scaleY, rotateZ, ghostOffsetX, ghostOffsetY, ghostScale, ghostOpacity, phase]
//   );

//   const startBlob = useCallback(
//     (mode: "idle" | "speaking") => {
//       blobActiveRef.current = true;
//       if (mode === "idle") {
//         loadingPulse.setValue(0);
//         Animated.loop(
//           Animated.sequence([
//             Animated.timing(loadingPulse, { toValue: 1, duration: 900, useNativeDriver: false, easing: Easing.inOut(Easing.quad) }),
//             Animated.timing(loadingPulse, { toValue: 0, duration: 900, useNativeDriver: false, easing: Easing.inOut(Easing.quad) }),
//           ])
//         ).start();
//         scheduleMorph("idle");
//       } else {
//         scheduleMorph("speaking");
//       }
//     },
//     [scheduleMorph]
//   );

//   const stopBlob = useCallback(() => {
//     blobActiveRef.current = false;
//     Animated.parallel([
//       animateValue(rTL, baseR, 240),
//       animateValue(rTR, baseR, 240),
//       animateValue(rBR, baseR, 240),
//       animateValue(rBL, baseR, 240),
//       animateTransformValue(scaleX, 1, 240),
//       animateTransformValue(scaleY, 1, 240),
//       animateTransformValue(rotateZ, 0, 240),
//       animateTransformValue(ghostOffsetX, 0, 240),
//       animateTransformValue(ghostOffsetY, 0, 240),
//       animateTransformValue(ghostScale, 1.06, 240),
//       animateValue(ghostOpacity, 0, 200),
//       animateValue(phase, 0, 200),
//     ]).start();
//   }, [rTL, rTR, rBR, rBL, scaleX, scaleY, rotateZ, ghostOffsetX, ghostOffsetY, ghostScale, ghostOpacity, phase]);

//   // Audio helpers
//   const unloadSound = useCallback(async () => {
//     if (soundRef.current) {
//       try { await soundRef.current.unloadAsync(); } catch {}
//       soundRef.current = null;
//     }
//   }, []);

//   const playBase64Wav = useCallback(
//     async (b64: string) => {
//       try {
//         await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
//         await unloadSound();

//         const fileUri = FileSystem.cacheDirectory + "bobee_message.wav";
//         await FileSystem.writeAsStringAsync(fileUri, b64, { encoding: FileSystem.EncodingType.Base64 });

//         // Switch animations: loading -> speaking before we actually start playback
//         setLoading(false);
//         setSpeaking(true);
//         setFinished(false);
//         setShowFinishUI(false);

//         const { sound } = await Audio.Sound.createAsync({ uri: fileUri }, { shouldPlay: true });
//         soundRef.current = sound;
//         sound.setOnPlaybackStatusUpdate((st) => {
//           if (!("isLoaded" in st) || !st.isLoaded) return;
//           const s = st as AVPlaybackStatusSuccess;
//           if (s.didJustFinish) {
//             setSpeaking(false);
//             setFinished(true);
//           }
//         });
//       } catch (e: any) {
//         setError(e?.message || "Audio playback failed");
//         setSpeaking(false);
//         setFinished(true);
//       }
//     },
//     [unloadSound]
//   );

//   // Fetch (JSON, not stream) and play
//   const fetchOnce = useCallback(async () => {
//     setError(null);
//     setLoading(true);
//     try {
//       const user = getAuth().currentUser;
//       if (!user) { setError("Not signed in"); setLoading(false); return; }
//       const token = await user.getIdToken();

//       const res = await fetch(`${API_BASE}/api/bobee-message`, {
//         method: "POST",
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);

//       const data = await res.json();
//       const b64 = data?.audio?.b64;
//       if (!b64) {
//         setError("No audio in response");
//         setLoading(false);
//         setFinished(true);
//         return;
//       }
//       await playBase64Wav(b64);
//     } catch (e: any) {
//       setError(e?.message || "Failed");
//       setLoading(false);
//       setFinished(true);
//     }
//   }, [playBase64Wav]);

//   // Initial load
//   useEffect(() => {
//     fetchOnce();
//     return () => { if (soundRef.current) soundRef.current.unloadAsync(); };
//   }, [fetchOnce]);

//   // Pull-to-refresh -> fetch a new message
//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     await fetchOnce();
//     setRefreshing(false);
//   }, [fetchOnce]);

//   // Tie blob lifecycle to states
//   useEffect(() => {
//     if (loading) {
//       startBlob("idle");
//       return;
//     }
//     if (speaking) {
//       startBlob("speaking");
//       return;
//     }
//     if (finished) {
//       Animated.parallel([
//         Animated.timing(bubbleOpacity, { toValue: 0, duration: 600, useNativeDriver: false, easing: Easing.out(Easing.quad) }),
//         Animated.timing(ghostOpacity, { toValue: 0, duration: 600, useNativeDriver: false }),
//       ]).start(() => {
//         stopBlob();
//         setShowFinishUI(true);
//         finishOpacity.setValue(0);
//         Animated.timing(finishOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
//       });
//     }
//   }, [loading, speaking, finished, startBlob, stopBlob, bubbleOpacity, ghostOpacity, finishOpacity]);

//   return (
//     <>
//       <Header title="Personal message" />
//       <ScrollView
//         contentContainerStyle={styles.container}
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
//       >
//         {error && <Text style={[styles.meta, styles.error]}>{error}</Text>}

//         <View style={styles.centerOuter}>
//           {!showFinishUI && (
//             <>
//               <Animated.View
//                 pointerEvents="none"
//                 style={[
//                   styles.bubbleGlow,
//                   {
//                     opacity: ghostOpacity,
//                     transform: [
//                       { translateX: ghostOffsetX },
//                       { translateY: ghostOffsetY },
//                       { scale: ghostScale },
//                       { rotate: rotateStr },
//                     ],
//                     borderTopLeftRadius: rTL,
//                     borderTopRightRadius: rTR,
//                     borderBottomRightRadius: rBR,
//                     borderBottomLeftRadius: rBL,
//                   },
//                 ]}
//               />
//               <Animated.View
//                 style={[
//                   styles.bubble,
//                   {
//                     transform: [
//                       { scaleX },
//                       { scaleY },
//                       { rotate: rotateStr },
//                       ...(loading
//                         ? [{ scale: loadingPulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] }) }]
//                         : []),
//                     ],
//                     borderTopLeftRadius: rTL,
//                     borderTopRightRadius: rTR,
//                     borderBottomRightRadius: rBR,
//                     borderBottomLeftRadius: rBL,
//                     opacity: bubbleOpacity,
//                   },
//                 ]}
//               >
//                 <Animated.View style={[styles.lighten, { opacity: lightenOpacity }]} />
//               </Animated.View>
//             </>
//           )}

//           {showFinishUI && (
//             <Animated.View style={[styles.finishSectionCentered, { opacity: finishOpacity }]}>
//               <Text style={styles.finishHeading}>Reflection complete</Text>
//               <Text style={styles.finishNote}>Come back tomorrow for a fresh personal reflection.</Text>
//               <Pressable style={styles.finishBtn} onPress={() => router.replace("/(tabs)/insights")}>
//                 <Text style={styles.finishBtnText}>Back to insights</Text>
//               </Pressable>
//             </Animated.View>
//           )}
//         </View>
//       </ScrollView>
//     </>
//   );
// }


import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Animated, Easing } from "react-native";
import { Audio, AVPlaybackStatusSuccess } from "expo-av";
import * as FileSystem from "expo-file-system";
import { colors } from "~/constants/Colors";
import Header from "~/components/other/Header";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import Constants from "expo-constants";

// Derive WebSocket base automatically: prefer explicit backendWsUrl, else convert backendUrl http->ws / https->wss
const extraCfg = (Constants.expoConfig?.extra as any) || {};
let WS_BASE: string | undefined = extraCfg.backendWsUrl;
if (!WS_BASE && typeof extraCfg.backendUrl === 'string') {
  WS_BASE = extraCfg.backendUrl.replace(/^http(s?):\/\//, (_m: string, s: string) => `ws${s ? 's' : ''}://`);
}

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

export default function PersonalMessageScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showFinishUI, setShowFinishUI] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Playback queue
  const soundRef = useRef<Audio.Sound | null>(null);
  const queueRef = useRef<string[]>([]); // file URIs
  const playingRef = useRef<boolean>(false);
  const endedRef = useRef<boolean>(false);

  // Animations (same variables as your file)
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

  // Anim helpers
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

  // ---- Playback queue helpers ----
  const playNextIfIdle = useCallback(async () => {
    if (playingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) {
      if (endedRef.current) {
        setSpeaking(false);
        setFinished(true);
      }
      return;
    }
    playingRef.current = true;
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      if (soundRef.current) { try { await soundRef.current.unloadAsync(); } catch {} soundRef.current = null; }
      const { sound } = await Audio.Sound.createAsync({ uri: next }, { shouldPlay: true });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((st) => {
        const s = st as AVPlaybackStatusSuccess;
        if (s.isLoaded && s.didJustFinish) {
          playingRef.current = false;
          playNextIfIdle(); // play the next file
        }
      });
    } catch (e) {
      playingRef.current = false;
      playNextIfIdle(); // skip to next on error
    }
  }, []);

  const enqueueFile = useCallback(async (b64: string, seq: number) => {
    const fileUri = `${FileSystem.cacheDirectory}bobee_chunk_${seq}.wav`;
    await FileSystem.writeAsStringAsync(fileUri, b64, { encoding: FileSystem.EncodingType.Base64 });
    queueRef.current.push(fileUri);
    // As soon as first chunk is enqueued, switch UI to speaking
    setLoading(false);
    setSpeaking(true);
    playNextIfIdle();
  }, [playNextIfIdle]);

  // ---- WebSocket session ----
  const startSession = useCallback(async () => {
    setError(null);
    setLoading(true);
    setSpeaking(false);
    setFinished(false);
    setShowFinishUI(false);
    queueRef.current = [];
    playingRef.current = false;
    endedRef.current = false;

    try {
      if (!WS_BASE) {
        setError("Missing WS base URL (backendWsUrl) in app config");
        setLoading(false);
        return;
      }
      const user = getAuth().currentUser;
      if (!user) { setError("Not signed in"); setLoading(false); return; }
      const token = await user.getIdToken();
      const wsUrl = `${WS_BASE.replace(/\/$/, '')}/ws/bobee-message?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);
      console.log("Opening WebSocket", wsUrl);

      ws.onopen = () => { console.log("WebSocket open"); };
      ws.onerror = (e: any) => { console.log('WebSocket error event', e?.message || e); setError("WebSocket error"); };
      ws.onclose = (ev) => { console.log('WebSocket closed', ev.code, ev.reason); };

      ws.onmessage = async (ev) => {
        try {
          const msg = JSON.parse(String(ev.data));
          if (msg.type === "speech") {
            // we could show text somewhere if you want
            // also switch animations from loading->speaking on first audio, not here
            return;
          }
          if (msg.type === "audio") {
            // { seq, b64, sr, mime }
            await enqueueFile(msg.b64, msg.seq);
            return;
          }
          if (msg.type === "end") {
            endedRef.current = true;
            // when queue drains, finished=true will be set by playNextIfIdle()
            return;
          }
          if (msg.type === "error") {
            setError(msg.message || "TTS error");
            ws.close();
          }
        } catch (e) {
          // ignore malformed frames
        }
      };
    } catch (e: any) {
      setError(e?.message || "Failed to start session");
      setLoading(false);
    }
  }, [enqueueFile]);

  useEffect(() => {
    startSession();
    return () => { if (soundRef.current) soundRef.current.unloadAsync(); };
  }, [startSession]);

  // pull-to-refresh: start a new session
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await startSession();
    setRefreshing(false);
  }, [startSession]);

  // tie blob lifecycle to states
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
              <Pressable style={styles.finishBtn} onPress={() => router.replace("/(tabs)/insights")}>
                <Text style={styles.finishBtnText}>Back to insights</Text>
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
  finishBtn: { marginTop: 40, backgroundColor: colors.blue, paddingVertical: 18, paddingHorizontal: 42, borderRadius: 50, alignItems: 'center', shadowColor: colors.blue, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 8 }, shadowRadius: 24 },
  finishBtnText: { color: '#fff', fontFamily: 'SpaceMono', fontSize: 18, fontWeight: '600', letterSpacing: 0.8 },
  finishSection: { marginTop: 34, alignItems: 'center', paddingHorizontal: 16 },
  finishSectionCentered: { position: 'absolute', top: '50%', left: '50%', width: 300, marginLeft: -150, marginTop: -120, alignItems: 'center', paddingHorizontal: 16 },
  finishHeading: { fontSize: 22, fontWeight: '600', color: colors.dark, fontFamily: 'SpaceMono', marginBottom: 10 },
  finishNote: { fontSize: 13, color: colors.dark, opacity: 0.75, fontFamily: 'SpaceMono', textAlign: 'center', lineHeight: 18, maxWidth: 260 },

  meta: { fontSize: 14, color: colors.dark, fontFamily: 'SpaceMono', marginBottom: 12 },
  error: { color: 'crimson' },
  note: { marginTop: 14, fontSize: 12, color: colors.dark, opacity: 0.7, fontFamily: 'SpaceMono' }
})
