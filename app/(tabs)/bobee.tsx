import React, { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, StatusBar, StyleSheet, View, Text, ScrollView, Pressable } from "react-native";
import { Lightbulb, Target, CheckCircle2, ListTodo, Heart, Compass, Sun, Mail } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import Header from "~/components/other/Header";
import SpinningLoader from "~/components/other/SpinningLoader";
import { colors } from "~/constants/Colors";
import { useFocusEffect } from "expo-router";
import { getAuth } from "@firebase/auth";
import { NextMessageCountdown } from "~/components/bobee/NextMessageCountdown";
import Constants from 'expo-constants'
import TutorialOverlay from '~/components/other/TutorialOverlay';
import { useLocalSearchParams } from 'expo-router';

export default function BobeeMainPage() {
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[] | null>(null)
  const [microChallenge, setMicroChallenge] = useState<string | null>(null)
  const [insightsError, setInsightsError] = useState<string | null>(null)
  const [reflectionQuestion, setRefelectionQuestion] = useState<string | null>(null)
  const [reflectionOptions, setReflectionOptions] = useState<{ text: string }[] | null>(null)
  const [selectedReflectionOption, setSelectedReflectionOption] = useState<string | null>(null)
  const [reflectionDoneToday, setReflectionDoneToday] = useState<boolean>(false)
  const router = useRouter()
  const { tour } = useLocalSearchParams<{ tour?: string }>();
  const [showTutorial, setShowTutorial] = useState(false);
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string

  // Rotate a small set of icons so each suggestion has a different one
  const suggestionIcons = [Lightbulb, CheckCircle2, ListTodo, Heart, Compass, Sun]

  // Caching refs (persist across focuses while component mounted)
  const hasFetchedRef = useRef(false);
  const lastFetchTsRef = useRef<number | null>(null);
  const lastDayKeyRef = useRef<string | null>(null);
  const STALE_MS = 1000 * 60 * 10; // 10 minutes (adjust as desired)

  const todayKey = new Date().toISOString().slice(0,10); // YYYY-MM-DD

  const refetchMeta = useCallback(async () => {
    try {
      const user = getAuth().currentUser
      if (!user) return
      const token = await user.getIdToken()
      const res = await fetch(`${API_BASE}/api/bobee-message-meta`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data = await res.json() as { lastBobeeMessage: number | null }
      setLastMessageAt(data.lastBobeeMessage ?? null)
    } catch (_) { /* silent */ }
  }, [API_BASE])
  
  const fetchInsights = useCallback(async () => {
    try {
      setInsightsLoading(true)
      setInsightsError(null)
      const user = getAuth().currentUser
      if (!user) { setInsightsLoading(false); return }
      const token = await user.getIdToken()
      const r = await fetch(`${API_BASE}/api/ai-insights`, { headers: { Authorization: `Bearer ${token}` } })
      if (!r.ok) throw new Error('failed')
      const json = await r.json() as { suggestions: string[]; microChallenge: string | null; reflectionQuestion: string | null; reflectionOptions?: { text: string }[]; reflectionCompleted?: boolean }
      setSuggestions(json.suggestions || [])
      setMicroChallenge(json.microChallenge || null)
      setRefelectionQuestion(json.reflectionQuestion || null)
      setReflectionOptions(Array.isArray(json.reflectionOptions) ? json.reflectionOptions : [])
  setReflectionDoneToday(!!json.reflectionCompleted)
    } catch (_) {
      setInsightsError('Could not load insights')
    } finally {
      setInsightsLoading(false)
    }
  }, [API_BASE])
  
  // Only fetch when: first focus, different day, or stale timeout elapsed.
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const stale = !lastFetchTsRef.current || (now - lastFetchTsRef.current) > STALE_MS;
      const newDay = lastDayKeyRef.current !== todayKey;
      if (!hasFetchedRef.current || stale || newDay) {
        refetchMeta();
        fetchInsights();
        hasFetchedRef.current = true;
        lastFetchTsRef.current = now;
        lastDayKeyRef.current = todayKey;
      }
    }, [refetchMeta, fetchInsights, todayKey])
  )

  // Initial metadata fetch on mount (restored per product request)
  // Initial fetch on mount (will set refs so focus effect won't immediately refetch again)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = getAuth().currentUser
        if (user) {
          const token = await user.getIdToken()
          const res = await fetch(`${API_BASE}/api/bobee-message-meta`, { headers: { Authorization: `Bearer ${token}` } })
          if (res.ok) {
            const data = await res.json() as { lastBobeeMessage: number | null }
            if (!cancelled) {
              setLastMessageAt(data.lastBobeeMessage ?? null)
              hasFetchedRef.current = true;
              lastFetchTsRef.current = Date.now();
              lastDayKeyRef.current = todayKey;
            }
          }
        }
      } catch { /* silent */ }
      setShowTutorial(tour === '4');
    })();
    return () => { cancelled = true }
  }, [API_BASE, todayKey, router, tour])

  return (
    <>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.lightest} />
      <Header title="Bobee" />
      {insightsLoading ? (
        <View style={styles.globalLoaderOverlay}>
          <SpinningLoader size={46} thickness={5} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <NextMessageCountdown lastMessageAt={lastMessageAt} />
          <Text style={styles.sectionHeading}>Daily suggestions</Text>
          <View style={styles.insightsBlock}>
            {insightsError && <Text style={styles.errorText}>{insightsError}</Text>}
            {!insightsError && suggestions && suggestions.length > 0 && (
              <View>
                {suggestions.map((s, i) => (
                  <View key={i}>
                    <View style={styles.suggestionItem}>
                      {(() => { const Icon = suggestionIcons[i % suggestionIcons.length]; return <Icon color={colors.blue} size={20} strokeWidth={2.5} style={styles.suggestionIcon} /> })()}
                      <Text style={styles.suggestionText}>{s}</Text>
                    </View>
                    {i < suggestions.length - 1 && <View style={styles.suggestionDivider} />}
                  </View>
                ))}
                {microChallenge && (
                  <View style={styles.challengeBox}>
                    <View style={styles.challengeHeader}>
                      <Target color={colors.blue} size={20} strokeWidth={2.5} style={{ marginRight: 6 }} />
                      <Text style={styles.challengeLabel}>Micro challenge</Text>
                    </View>
                    <Text style={styles.challengeText}>{microChallenge}</Text>
                  </View>
                )}
              </View>
            )}
            {!insightsError && (!suggestions || suggestions.length === 0) && (
              <View>
                <Text style={styles.emptyInsightsTitle}>Welcome to Bobee</Text>
                <Text style={styles.emptyInsights}>Once you have a few journal entries, I’ll craft daily suggestions, a micro challenge, and a reflection question here. For now, you can start a chat or write a quick journal to seed more personalized insights.</Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionHeading}>Today's reflection</Text>
          <Pressable
            style={[styles.reflectionBlock, reflectionDoneToday && { opacity: 0.55 }]}
            disabled={reflectionDoneToday || !reflectionOptions || reflectionOptions.length === 0}
            onPress={() => {
              if (reflectionDoneToday) return
              if (reflectionOptions && reflectionOptions.length > 0) {
                const opts = encodeURIComponent(JSON.stringify(reflectionOptions.map(o => o.text)))
                const q = encodeURIComponent(reflectionQuestion || '')
                router.push(`/bobee/reflection?q=${q}&options=${opts}`)
              }
            }}
          >
            {reflectionDoneToday ? (
              <View>
                <Text style={styles.reflectionText}>{reflectionQuestion}</Text>
                <Text style={styles.reflectionCompletedNote}>Reflection completed for today. Come back tomorrow.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.reflectionText}>{reflectionQuestion}</Text>
                {selectedReflectionOption && <Text style={styles.reflectionAnswer}>Your answer: {selectedReflectionOption}</Text>}
                {reflectionOptions && reflectionOptions.length > 0 && !selectedReflectionOption && (
                  <View style={styles.reflectionBadge} pointerEvents='none'>
                    <Mail size={14} color={colors.lightest} style={{ marginRight: 4 }} />
                    <Text style={styles.reflectionBadgeText}>Answer</Text>
                  </View>
                )}
              </>
            )}
          </Pressable>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
    {showTutorial && (
      <TutorialOverlay
        step={4}
        total={4}
        title="Your daily AI hub"
        description="See suggestions, a micro challenge and reflection. You're all set!"
        nextLabel="Finish"
        onNext={() => {
          setShowTutorial(false);
          router.push('/journal');
        }}
        onSkip={() => setShowTutorial(false)}
      />
    )}
    </>
  )

}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightest },
  scrollContent: { padding: 20 },
  insightsBlock: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.lighter },
  sectionHeading: { fontSize: 22, fontFamily: 'SpaceMono', color: colors.darkest, marginTop: 20, marginBottom: 10 },
  suggestionItem: { flexDirection: 'row', alignItems: 'flex-start'},
  suggestionIcon: { marginTop: 4, marginRight: 10 },
  suggestionText: { flex: 1, fontSize: 15, lineHeight: 21, color: colors.darkest, fontFamily: 'SpaceMono' },
  challengeBox: { marginTop: 28, padding: 14, backgroundColor: '#f5f7ff', borderRadius: 14, borderWidth: 1, borderColor: colors.lighter },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  challengeLabel: { fontSize: 18, fontWeight: '600', color: colors.blue, fontFamily: 'SpaceMono' },
  challengeText: { fontSize: 15, lineHeight: 20, color: colors.darkest, fontFamily: 'SpaceMono' },
  emptyInsights: { marginTop: 10, fontSize: 13, fontFamily: 'SpaceMono', color: colors.dark },
  emptyInsightsTitle: { marginTop: 4, fontSize: 16, fontFamily: 'SpaceMono', color: colors.darkest, fontWeight: '600', marginBottom: 6 },
  errorText: { marginTop: 10, fontSize: 13, fontFamily: 'SpaceMono', color: 'crimson' },
  suggestionDivider: {
    height: 1,
    backgroundColor: colors.lighter,
    marginVertical: 15,
  },
  loaderWrap: { marginTop: 8, paddingVertical: 6, alignItems: 'center', justifyContent: 'center' },
  reflectionBlock: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.lighter, minHeight: 80, position: 'relative' },
  reflectionText: { fontSize: 15, lineHeight: 21, color: colors.darkest, fontFamily: 'SpaceMono', paddingRight: 70 },
  reflectionAnswer: { marginTop: 10, fontSize: 13, color: colors.dark, fontFamily: 'SpaceMono', fontStyle: 'italic' },
  reflectionCompletedNote: { marginTop: 10, fontSize: 12, color: colors.dark, fontFamily: 'SpaceMono', fontStyle: 'italic' },
  reflectionBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: colors.blue, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 24, flexDirection: 'row', alignItems: 'center' },
  reflectionBadgeText: { fontSize: 12, fontFamily: 'SpaceMono', color: '#fff', fontWeight: '600' },
  globalLoaderOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' }
});
