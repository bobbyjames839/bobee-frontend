import React, { useCallback, useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, StatusBar, StyleSheet, View, Text, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { Lightbulb, Target, CheckCircle2, ListTodo, Heart, Compass, Sun } from 'lucide-react-native'
import Header from "~/components/other/Header";
import { colors } from "~/constants/Colors";
import { useFocusEffect } from "expo-router";
import { getAuth } from "@firebase/auth";
import { NextMessageCountdown } from "~/components/bobee/NextMessageCountdown";
import Constants from 'expo-constants'

export default function BobeeMainPage() {
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [suggestions, setSuggestions] = useState<string[] | null>(null)
  const [microChallenge, setMicroChallenge] = useState<string | null>(null)
  const [insightsError, setInsightsError] = useState<string | null>(null)
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string

  // Rotate a small set of icons so each suggestion has a different one
  const suggestionIcons = [Lightbulb, CheckCircle2, ListTodo, Heart, Compass, Sun]

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
      const json = await r.json() as { suggestions: string[]; microChallenge: string | null }
      setSuggestions(json.suggestions || [])
      setMicroChallenge(json.microChallenge || null)
    } catch (_) {
      setInsightsError('Could not load insights')
    } finally {
      setInsightsLoading(false)
    }
  }, [API_BASE])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([refetchMeta(), fetchInsights()])
    } finally {
      setRefreshing(false)
    }
  }, [refetchMeta, fetchInsights])

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = getAuth().currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetch(`${API_BASE}/api/bobee-message-meta`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json() as { lastBobeeMessage: number | null };
        if (!cancelled) setLastMessageAt(data.lastBobeeMessage ?? null);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [API_BASE])


  useFocusEffect(
    useCallback(() => {
      let active = true
      // Kick off both fetches on focus
      refetchMeta()
      fetchInsights()
      return () => { active = false }
    }, [refetchMeta, fetchInsights])
  )

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.lightest} />
      <Header title="Bobee" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
      >
        <NextMessageCountdown
          lastMessageAt={lastMessageAt}
        />
        <Text style={styles.sectionHeading}>Daily suggestions</Text>
        <View style={styles.insightsBlock}>
          {insightsLoading && <ActivityIndicator color={colors.blue} style={{ marginTop: 8 }} />}
          {insightsError && <Text style={styles.errorText}>{insightsError}</Text>}
          {!insightsLoading && !insightsError && suggestions && suggestions.length > 0 && (
            <View>
              {suggestions.map((s, i) => (
                <View key={i}>
                  <View style={styles.suggestionItem}>
                    {(() => {
                      const Icon = suggestionIcons[i % suggestionIcons.length]
                      return <Icon color={colors.blue} size={20} strokeWidth={2.5} style={styles.suggestionIcon} />
                    })()}
                    <Text style={styles.suggestionText}>{s}</Text>
                  </View>

                  {/* Add divider except after the last suggestion */}
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
          {!insightsLoading && !insightsError && (!suggestions || suggestions.length === 0) && (
            <Text style={styles.emptyInsights}>No suggestions yet.</Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
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
  errorText: { marginTop: 10, fontSize: 13, fontFamily: 'SpaceMono', color: 'crimson' },
  suggestionDivider: {
    height: 1,
    backgroundColor: colors.lighter,
    marginVertical: 15,
  },
});
