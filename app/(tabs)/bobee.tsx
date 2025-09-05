import React, { useCallback, useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, StatusBar, StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import Header from "~/components/other/Header";
import useBobee from "~/hooks/useBobee";
import { colors } from "~/constants/Colors";
import { router, useFocusEffect } from "expo-router";
import { getAuth } from "@firebase/auth";
import { NextMessageCountdown } from "~/components/bobee/NextMessageCountdown";
import Constants from 'expo-constants'

export default function BobeeMainPage() {
  const { isLoading } = useBobee();
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null)
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string

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
      const refetchMeta = async () => {
        try {
          const user = getAuth().currentUser
          if (!user) return
          const token = await user.getIdToken()
          const res = await fetch(`${API_BASE}/api/bobee-message-meta`, { headers: { Authorization: `Bearer ${token}` } })
          if (!res.ok) return
          const data = await res.json() as { lastBobeeMessage: number | null }
          if (!active) return
          setLastMessageAt(data.lastBobeeMessage ?? null)
        } catch (_) { /* silent */ }
      }
      refetchMeta()
      return () => { active = false }
    }, [])
  )

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.lightest} />
      <Header title="Bobee" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <NextMessageCountdown
          lastMessageAt={lastMessageAt}
        />
        <Text style={styles.pageTitle}>Start a Chat</Text>
        <View style={styles.launchWrapper}>
          <TouchableOpacity
            style={[styles.launchButton, isLoading && styles.disabledButton]}
            onPress={() => router.push({ pathname: '/bobee/chat' })}
            disabled={isLoading}
          >
            <Text style={styles.launchText}>{isLoading ? 'Loading…' : 'Ask Bobee'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightest },
  scrollContent: { padding: 20 },
  pageTitle: { fontSize: 20, fontFamily: 'SpaceMono', color: colors.darkest, marginTop: 28, marginBottom: 8 },
  launchWrapper: { marginTop: 4 },
  launchButton: { backgroundColor: colors.blue, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  launchText: { color: '#fff', fontSize: 20, fontFamily: 'SpaceMono', letterSpacing: 0.5 },
  disabledButton: { opacity: 0.6 },
});
