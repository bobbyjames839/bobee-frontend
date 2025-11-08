import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  Lightbulb,
  Target,
  CheckCircle2,
  ListTodo,
  Heart,
  Compass,
  Sun,
  Mail,
  MessageCircle,
} from "lucide-react-native";
import Svg, { Defs, LinearGradient, Stop, Polygon } from "react-native-svg";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import Header from "~/components/other/Header";
import SpinningLoader from "~/components/other/SpinningLoader";
import { colors } from "~/constants/Colors";
import { getAuth } from "@firebase/auth";
import { NextMessageCountdown } from "~/components/bobee/NextMessageCountdown";
import Constants from "expo-constants";
import TutorialOverlay from "~/components/other/TutorialOverlay";

export default function BobeeMainPage() {
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [microChallenge, setMicroChallenge] = useState<string | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [reflectionQuestion, setRefelectionQuestion] = useState<string | null>(null);
  const [reflectionOptions, setReflectionOptions] = useState<{ text: string }[] | null>(null);
  const [selectedReflectionOption, setSelectedReflectionOption] = useState<string | null>(null);
  const [reflectionDoneToday, setReflectionDoneToday] = useState<boolean>(false);

  const router = useRouter();
  const { tour } = useLocalSearchParams<{ tour?: string }>();
  const [showTutorial, setShowTutorial] = useState(false);
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string;

  const suggestionIcons = [Lightbulb, CheckCircle2, ListTodo, Heart, Compass, Sun];

  // caching to avoid excessive fetches
  const hasFetchedRef = useRef(false);
  const lastFetchTsRef = useRef<number | null>(null);
  const lastDayKeyRef = useRef<string | null>(null);
  const STALE_MS = 1000 * 60 * 10; // 10 minutes
  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const refetchMeta = useCallback(async () => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/api/bobee-message-meta`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { lastBobeeMessage: number | null };
      setLastMessageAt(data.lastBobeeMessage ?? null);
    } catch {
      // silent
    }
  }, [API_BASE]);

  const fetchInsights = useCallback(async () => {
    try {
      setInsightsLoading(true);
      setInsightsError(null);
      const user = getAuth().currentUser;
      if (!user) {
        setInsightsLoading(false);
        return;
      }
      const token = await user.getIdToken();
      const r = await fetch(`${API_BASE}/api/ai-insights`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("failed");
      const json = (await r.json()) as {
        suggestions: string[];
        microChallenge: string | null;
        reflectionQuestion: string | null;
        reflectionOptions?: { text: string }[];
        reflectionCompleted?: boolean;
      };
      setSuggestions(json.suggestions || []);
      setMicroChallenge(json.microChallenge || null);
      setRefelectionQuestion(json.reflectionQuestion || null);
      setReflectionOptions(Array.isArray(json.reflectionOptions) ? json.reflectionOptions : []);
      setReflectionDoneToday(!!json.reflectionCompleted);
    } catch {
      setInsightsError("Could not load insights");
    } finally {
      setInsightsLoading(false);
    }
  }, [API_BASE]);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const stale = !lastFetchTsRef.current || now - (lastFetchTsRef.current ?? 0) > STALE_MS;
      const newDay = lastDayKeyRef.current !== todayKey;

      if (!hasFetchedRef.current || stale || newDay) {
        refetchMeta();
        fetchInsights();
        hasFetchedRef.current = true;
        lastFetchTsRef.current = now;
        lastDayKeyRef.current = todayKey;
      }
    }, [refetchMeta, fetchInsights, todayKey])
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = getAuth().currentUser;
        if (user) {
          const token = await user.getIdToken();
          const res = await fetch(`${API_BASE}/api/bobee-message-meta`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = (await res.json()) as { lastBobeeMessage: number | null };
            if (!cancelled) {
              setLastMessageAt(data.lastBobeeMessage ?? null);
              hasFetchedRef.current = true;
              lastFetchTsRef.current = Date.now();
              lastDayKeyRef.current = todayKey;
            }
          }
        }
      } catch {
        // silent
      }
      setShowTutorial(tour === "4");
    })();
    return () => {
      cancelled = true;
    };
  }, [API_BASE, todayKey, router, tour]);

  return (
    <>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.lightest} />
        <Header title="Bobee" />

        {insightsLoading ? (
          <View style={styles.globalLoaderOverlay}>
            <SpinningLoader size={46} thickness={5} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <NextMessageCountdown lastMessageAt={lastMessageAt} />

            <Pressable
              style={[styles.reflectionPill, reflectionDoneToday && { opacity: 0.55 }]}
              disabled={reflectionDoneToday || !reflectionOptions || reflectionOptions.length === 0}
              onPress={() => {
                if (reflectionDoneToday) return;
                if (reflectionOptions && reflectionOptions.length > 0) {
                  const opts = encodeURIComponent(JSON.stringify(reflectionOptions.map((o) => o.text)));
                  const q = encodeURIComponent(reflectionQuestion || "");
                  router.push(`/bobee/reflection?q=${q}&options=${opts}`);
                }
              }}
            >
              {/* Decorative right-side span with slanted left edge */}
              <Svg pointerEvents="none" style={styles.reflectionSpan} viewBox="0 0 100 100" preserveAspectRatio="none">
                <Defs>
                  <LinearGradient id="reflectGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#ffffff" stopOpacity={0.18} />
                    <Stop offset="1" stopColor="#ffffff" stopOpacity={0.04} />
                  </LinearGradient>
                </Defs>
                <Polygon points="15,0 100,0 100,100 0,100" fill="url(#reflectGrad)" />
              </Svg>

              {/* TEXT COLUMN — fixed to wrap instead of overflowing left */}
              <View style={styles.reflectionTextCol}>
                <View style={styles.readyContentTop}>
                  <Text style={styles.reflectionArrow}>←</Text>
                  <Text style={styles.readyTitle}>DAILY REFLECTION</Text>
                </View>
                <Text style={styles.readyNote}>Tap to complete your daily reflection</Text>
              </View>

              {/* ICON */}
              <View style={styles.reflectionIconCircle}>
                <Mail size={32} color={"#fff"} />
              </View>
            </Pressable>

            <View style={styles.insightsBlock}>
              {insightsError && <Text style={styles.errorText}>{insightsError}</Text>}
              {!insightsError && suggestions && suggestions.length > 0 && (
                <>
                  <View style={styles.insightsBlockRight}>
                    {/* Vertical connecting line */}
                    <View style={styles.timelineSpine} />

                    {suggestions.map((s, i) => (
                      <View key={i}>
                        <View style={styles.suggestionItem}>
                          {/* Icon positioned absolutely to the left */}
                          <View style={styles.suggestionIconContainer}>
                            {(() => {
                              const Icon = suggestionIcons[i % suggestionIcons.length];
                              return <Icon color={colors.blue} size={20} strokeWidth={2.5} />;
                            })()}
                          </View>
                          <Text style={styles.suggestionText}>{s}</Text>
                        </View>
                        {i < suggestions.length - 1 && <View style={styles.suggestionDivider} />}
                      </View>
                    ))}
                    <Image source={require("../../assets/images/happy.png")} style={styles.insightsBackgroundImage} />
                  </View>
                </>
              )}
              {!insightsError && (!suggestions || suggestions.length === 0) && (
                <View>
                  <Text style={styles.emptyInsightsTitle}>Welcome to Bobee</Text>
                  <Text style={styles.emptyInsights}>
                    Once you have a few journal entries, I’ll craft daily suggestions, a micro challenge, and a reflection
                    question here. For now, you can start a chat or write a quick journal to seed more personalized insights.
                  </Text>
                </View>
              )}
            </View>

            {microChallenge && (
              <View style={styles.challengeBox}>
                <Target color={colors.blue} size={74} strokeWidth={2} style={{ marginRight: 10 }} />
                <View style={styles.challengeRight}>
                  <Text style={styles.challengeLabel}>Micro Challenge</Text>
                  <Text style={styles.challengeText}>{microChallenge}</Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Floating chat FAB */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.chatCta}
          accessibilityRole="button"
          accessibilityLabel="Open chat with Bobee"
          onPress={() => router.push("/bobee/chat")}
        >
          <MessageCircle color={colors.blue} size={32} strokeWidth={2.5} />
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {showTutorial && (
        <TutorialOverlay
          step={4}
          total={5}
          title="Your daily AI hub"
          description={"See suggestions, a micro challenge and a reflection question to guide you."}
          nextLabel="Chat with Bobee"
          onNext={() => {
            setShowTutorial(false);
            router.push("/bobee/chat?tour=5");
          }}
          onSkip={() => setShowTutorial(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.lightest,
  },
  scrollContent: {
    paddingVertical: 30,
  },
  insightsBlock: {
    display: "flex",
    marginTop: 20,
  },
  insightsBlockRight: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 20,
    borderTopLeftRadius: 20,
    width: "80%",
    alignSelf: "flex-end",
    padding: 16,
    borderWidth: 1,
    borderColor: colors.lighter,
    position: "relative",
  },
  insightsBackgroundImage: {
    position: "absolute",
    bottom: -20,
    right: -50,
    width: 180,
    height: 180,
    opacity: 0.1,
    transform: [{ rotate: "-25deg" }],
  },
  timelineSpine: {
    position: "absolute",
    left: -45,
    top: 22,
    height: 150,
    width: 2,
    backgroundColor: colors.lighter,
    borderRadius: 2,
  },
  suggestionIconContainer: {
    position: "absolute",
    left: -80,
    top: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.lighter,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 2,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: colors.darkest,
    fontFamily: "SpaceMono",
  },
  challengeBox: {
    marginTop: 20,
    padding: 12,
    width: "100%",
    boxSizing: "border-box" as any,
    backgroundColor: "#f5f7ff",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    borderColor: colors.lighter,
  },
  challengeRight: {
    flexDirection: "column",
    flex: 1,
  },
  challengeLabel: {
    fontSize: 18,
    color: colors.darkest,
    fontFamily: "SpaceMonoSemibold",
  },
  challengeText: {
    fontSize: 15,
    lineHeight: 20,
    marginTop: 5,
    color: colors.darker,
    fontFamily: "SpaceMono",
  },
  emptyInsights: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: "SpaceMono",
    color: colors.dark,
  },
  emptyInsightsTitle: {
    marginTop: 4,
    fontSize: 16,
    fontFamily: "SpaceMono",
    color: colors.darkest,
    fontWeight: "600",
    marginBottom: 6,
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: "SpaceMono",
    color: "crimson",
  },
  suggestionDivider: {
    height: 1,
    backgroundColor: colors.lighter,
    marginVertical: 15,
  },
  loaderWrap: {
    marginTop: 8,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  // REFLECTION CTA
  reflectionPill: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: colors.blue,
    width: "85%",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopRightRadius: 50,
    borderBottomRightRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 6,
    position: "relative",
    overflow: "hidden",
  },
  reflectionSpan: { position: "absolute", top: 0, bottom: 0, right: 0, width: "65%", zIndex: 0 },

  // NEW: text column that wraps properly
  reflectionTextCol: {
    flex: 1,
    minWidth: 0, // allow shrinking so text wraps instead of overflowing
    flexShrink: 1,
    marginRight: 20,
    flexDirection: "column",
    alignItems: "flex-end",
    zIndex: 1,
  },

  reflectionIconCircle: {
    width: 74,
    height: 74,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  reflectionArrow: {
    fontSize: 24,
    color: "rgba(255,255,255,0.85)",
    marginRight: 14,
    fontFamily: "SpaceMono",
    zIndex: 1,
  },
  readyContentTop: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  readyTitle: {
    color: colors.lightest,
    fontFamily: "SpaceMonoSemibold",
    fontSize: 18,
  },
  readyNote: {
    marginTop: 5,
    color: colors.lighter,
    fontFamily: "SpaceMono",
    fontSize: 15,
    textAlign: "right",
    alignSelf: "stretch",
    flexShrink: 1,
    zIndex: 1,
  },

  globalLoaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  chatCta: {
    position: "absolute",
    bottom: 14,
    right: 14,
    width: 66,
    height: 66,
    borderRadius: 38,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.lighter,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
});
