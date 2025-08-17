// app/(modals)/journal/response.tsx
import React, { useContext, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';

import { useJournalRecording } from '~/hooks/useJournals';
import { SubscriptionContext } from '~/context/SubscriptionContext';
import { colors } from '~/constants/Colors';

type AIResponse = {
  moodScore: number;
  summary: string;
  selfInsight: string;
  thoughtPattern: string;
  nextStep: string;
  feelings: string[];
};

// Adjust filenames if yours differ
const FACE_VERY_SAD = require('~/assets/images/verysad.png');
const FACE_SAD = require('~/assets/images/sad.png');
const FACE_NEUTRAL = require('~/assets/images/mid.png');
const FACE_SLIGHTLY_HAPPY = require('~/assets/images/happy.png');
const FACE_VERY_HAPPY = require('~/assets/images/veryhappy.png');

function pickFace(score: number) {
  if (score <= 2) return FACE_VERY_SAD;
  if (score <= 4) return FACE_SAD;
  if (score <= 6) return FACE_NEUTRAL;
  if (score <= 8) return FACE_SLIGHTLY_HAPPY;
  return FACE_VERY_HAPPY;
}

function ResponseInner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSubscribed } = useContext(SubscriptionContext);
  const journal = useJournalRecording();

  // 1) Decode response data from the URL param (authoritative)
  const { payload } = useLocalSearchParams<{ payload?: string }>();
  const parsed = useMemo(() => {
    if (!payload) return null;
    try {
      return JSON.parse(decodeURIComponent(payload)) as {
        aiResponse: AIResponse;
        wordCount: number | null;
        currentStreak: number | null;
      };
    } catch {
      return null;
    }
  }, [payload]);

  // 2) Pick data: prefer URL payload; otherwise fall back to hook (if it happens to have it)
  const ai = parsed?.aiResponse ?? journal.aiResponse ?? null;
  const wordCount = parsed?.wordCount ?? journal.wordCount ?? 0;
  const currentStreak = parsed?.currentStreak ?? journal.currentStreak ?? 0;

  // 3) If we truly have nothing yet, show a lightweight loader (don’t auto-back)
  if (!ai) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" translucent backgroundColor="transparent" />
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconWrap}>
            <Ionicons name="chevron-back" size={28} color="#222" />
          </TouchableOpacity>
          <Text style={styles.title}>Journal Response</Text>
          <View style={styles.iconWrap} />
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.blue} />
          <Text style={styles.loadingText}>Preparing response…</Text>
        </View>
      </View>
    );
  }

  const faceSource = pickFace(ai.moodScore ?? 5);

  const feelingBg = ['#B3DFFC', '#D1C4E9', '#B2DFDB'];
  const feelingBorder = ['#89c5eeff', '#b89ee8ff', '#8de2dbff'];

  // Handlers come from the hook (if available). If not, we disable the buttons gracefully.
  const canUpgrade = typeof journal.handleUpgrade === 'function';
  const canUpgradeTwo = typeof journal.handleUpgradeTwo === 'function';
  const canSubmit = typeof journal.handleSubmitJournal === 'function';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Header flush to the top */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconWrap}>
          <Ionicons name="chevron-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text style={styles.title}>Journal Response</Text>
        <View style={styles.iconWrap} />
      </View>

      {/* Body */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          ...styles.scrollContainer,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.responseBox}>
          {/* Corner badge */}
          <View style={styles.cornerBadgeContainer}>
            <View
              style={[
                styles.cornerBadgeTriangle,
                { backgroundColor: isSubscribed ? colors.blue : colors.light },
              ]}
            />
            <Text style={styles.cornerBadgeText}>{isSubscribed ? 'Pro' : 'Free'}</Text>
          </View>

          {/* Summary */}
          <Text style={styles.sectionTitleTop}>Summary</Text>
          <Text style={styles.responseText}>{ai.summary}</Text>

          {/* Insight (blur overlay for free users) */}
          {!!ai.selfInsight && (
            <View style={styles.blurSection}>
              <Text style={styles.sectionTitle}>Insight</Text>
              <View style={isSubscribed ? styles.insightContent : styles.insightContentPadded}>
                <Text style={styles.responseText}>{ai.selfInsight}</Text>
                {!isSubscribed && (
                  <BlurView intensity={12} tint="light" style={styles.blurOverlayInner}>
                    <TouchableOpacity
                      onPress={canUpgrade ? journal.handleUpgrade : undefined}
                      disabled={!canUpgrade || journal.subscribeLoading}
                    >
                      <View style={styles.upgradeBlurButtonContent}>
                        {journal.subscribeLoading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.upgradeBlurButtonText}>Upgrade</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  </BlurView>
                )}
              </View>
            </View>
          )}

          {/* Mood + stats */}
          <View style={styles.moodRowContainer}>
            <View style={styles.moodBox}>
              {/* Mood face image (inline size to avoid style changes) */}
              <Image
                source={faceSource}
                style={{ width: 120, height: 120, resizeMode: 'contain' }}
                accessible
                accessibilityLabel="Mood indicator"
              />
            </View>
            <View style={styles.rightBoxesContainer}>
              <View style={[styles.statBox, styles.statBoxTop]}>
                <Text style={styles.statLabel}>Word Count</Text>
                <Text style={styles.statValue}>{wordCount ?? 0}</Text>
              </View>
              <View style={[styles.statBox, styles.statBoxBottom]}>
                <Text style={styles.statLabel}>Current Streak</Text>
                <Text style={styles.statValue}>
                  {currentStreak ?? 0} day{(currentStreak ?? 0) !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Feelings chips */}
          {!!ai.feelings?.length && (
            <View style={styles.feelingsRow}>
              {ai.feelings.map((word, i) => (
                <View
                  key={`${word}-${i}`}
                  style={[
                    styles.feelingBox,
                    { backgroundColor: feelingBg[i % feelingBg.length] },
                    { borderColor: feelingBorder[i % feelingBorder.length] },
                  ]}
                >
                  <Text style={styles.feelingText}>{word}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Thought pattern */}
          {!!ai.thoughtPattern && (
            <View style={styles.blurSection}>
              <Text style={styles.sectionTitle}>Thought Pattern</Text>
              <View style={isSubscribed ? styles.insightContent : styles.insightContentPadded}>
                <Text style={styles.responseText}>{ai.thoughtPattern}</Text>
                {!isSubscribed && (
                  <BlurView intensity={12} tint="light" style={styles.blurOverlayInner}>
                    <TouchableOpacity
                      onPress={canUpgradeTwo ? journal.handleUpgradeTwo : undefined}
                      disabled={!canUpgradeTwo || journal.secondSubscribeLoading}
                    >
                      <View style={styles.upgradeBlurButtonContent}>
                        {journal.secondSubscribeLoading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.upgradeBlurButtonText}>Upgrade</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  </BlurView>
                )}
              </View>
            </View>
          )}

          {/* Next step */}
          <Text style={styles.sectionTitle}>Next Step</Text>
          <Text style={styles.responseText}>{ai.nextStep}</Text>

          {/* Submit + Cancel on same row */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                journal.submitLoading && { opacity: 0.6 },
              ]}
              onPress={canSubmit ? journal.handleSubmitJournal : undefined}
              disabled={!canSubmit || !!journal.submitLoading}
            >
              {journal.submitLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {canSubmit ? 'Submit Journal' : 'Submit (unavailable)'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default function ResponseScreen() {
  return (
    <SafeAreaProvider>
      <ResponseInner />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightest },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    justifyContent: 'space-between',
  },
  iconWrap: { width: 28 },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
    fontFamily: 'SpaceMono',
  },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#555', fontFamily: 'SpaceMono' },

  // Inlined former JournalResponse styles
  scrollContainer: { paddingBottom: 30 },
  responseBox: {
    backgroundColor: '#FAFAFA',
    padding: 14,
    paddingTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.lighter,
  },
  sectionTitle: {
    marginTop: 20,
    fontSize: 18,
    fontFamily: 'SpaceMono',
    fontWeight: '600',
    marginBottom: 6,
    color: colors.blue,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 4,
  },
  sectionTitleTop: {
    marginTop: 5,
    fontSize: 18,
    fontFamily: 'SpaceMono',
    fontWeight: '600',
    marginBottom: 6,
    color: colors.blue,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 4,
  },
  responseText: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: 'SpaceMono',
    color: '#444',
  },
  blurSection: { position: 'relative' },
  insightContentPadded: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(173, 209, 246, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  insightContent: { position: 'relative', borderRadius: 8, overflow: 'hidden' },
  blurOverlayInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(155, 203, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBlurButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue,
    width: 160,
    paddingVertical: 8,
    borderRadius: 6,
  },
  upgradeBlurButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SpaceMono',
    fontWeight: '600',
  },
  moodRowContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  moodBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: colors.lighter,
    shadowOffset: { height: 0, width: 0 },
    elevation: 0,
  },
  rightBoxesContainer: { flex: 1, justifyContent: 'space-between' },
  statBox: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { height: 0, width: 0 },
    elevation: 0,
    borderWidth: 1,
    borderColor: colors.lighter,
  },
  statBoxTop: { marginBottom: 5 },
  statBoxBottom: { marginTop: 5 },
  statLabel: { fontSize: 14, fontFamily: 'SpaceMono', color: '#333333' },
  statValue: { fontSize: 20, fontWeight: '600', marginTop: 2, fontFamily: 'SpaceMono' },
  feelingsRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10, gap: 10 },
  feelingBox: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  feelingText: { color: 'black', fontSize: 14, fontFamily: 'SpaceMono' },
  submitButton: { backgroundColor: colors.blue, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 70 },
  submitButtonText: { color: '#fff', fontSize: 16, fontFamily: 'SpaceMono' },

  cornerBadgeContainer: {
    zIndex: 1000,
    position: 'absolute',
    top: 0,
    right: 0,
    width: 84,
    height: 84,
    overflow: 'hidden',
    borderTopRightRadius: 16,
  },
  cornerBadgeTriangle: {
    borderTopRightRadius: 16,
    position: 'absolute',
    width: 120,
    height: 120,
    top: -60,
    right: -60,
    transform: [{ rotate: '-45deg' }],
  },
  cornerBadgeText: {
    position: 'absolute',
    top: 15,
    right: 15,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'SpaceMono',
    transform: [{ rotate: '45deg' }],
  },

  // Added for the Submit/Cancel row
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ccc',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
});
