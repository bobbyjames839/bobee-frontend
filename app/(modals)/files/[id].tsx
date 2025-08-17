// app/(modals)/files/[id].tsx
import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SubscriptionContext } from '~/context/SubscriptionContext';
import useJournals, { JournalEntry } from '~/hooks/useFiles';
import { colors } from '~/constants/Colors';

// Face assets (adjust filenames if yours differ)
const FACE_VERY_SAD        = require('~/assets/images/verysad.png');
const FACE_SAD             = require('~/assets/images/sad.png');
const FACE_NEUTRAL         = require('~/assets/images/mid.png');
const FACE_SLIGHTLY_HAPPY  = require('~/assets/images/happy.png');
const FACE_VERY_HAPPY      = require('~/assets/images/veryhappy.png');

function pickFace(score: number) {
  if (score <= 2) return FACE_VERY_SAD;
  if (score <= 4) return FACE_SAD;
  if (score <= 6) return FACE_NEUTRAL;
  if (score <= 8) return FACE_SLIGHTLY_HAPPY;
  return FACE_VERY_HAPPY;
}

function JournalScreenInner() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { journals, loading, deleteJournal } = useJournals();
  const { isSubscribed } = useContext(SubscriptionContext);
  const insets = useSafeAreaInsets();

  const journal: JournalEntry | undefined = useMemo(
    () => journals.find(j => j.id === id),
    [journals, id]
  );

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
    setDeleteLoading(false);
    setUpgradeLoading(false);
  }, [id]);

  const doDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      setDeleteLoading(true);
      await deleteJournal(journal!.id);
      router.back();
    } finally {
      setDeleteLoading(false);
    }
  };

  const navigateToUpgrade = () => {
    setUpgradeLoading(true);
    router.replace('/(tabs)/settings/sub');
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <Pressable onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color="#222" />
      </Pressable>
      <Text style={styles.title}>Journal Detail</Text>
      <Pressable onPress={doDelete} disabled={deleteLoading}>
        {deleteLoading ? (
          <ActivityIndicator size="small" color="#B22222" />
        ) : (
          <MaterialIcons
            name={confirmDelete ? 'check' : 'delete-outline'}
            size={28}
            color="#B22222"
          />
        )}
      </Pressable>
    </View>
  );

  return (
    <View style={styles.fullscreen}>
      {/* Match day.tsx: translucent status bar + header padded by insets.top */}
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {renderHeader()}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.blue} />
        </View>
      ) : !journal ? (
        <View style={styles.center}>
          <Text>Couldn’t find this entry.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: (insets.bottom || 24) + 40 },
          ]}
        >
          {!!journal.prompt?.trim() && (
            <>
              <Text style={styles.section}>Prompt</Text>
              <Text style={styles.text}>{journal.prompt}</Text>
            </>
          )}

          <Text style={styles.section}>Transcript</Text>
          <Text style={styles.block}>{journal.transcript}</Text>

          <Text style={styles.section}>Summary</Text>
          <Text style={styles.text}>{journal.aiResponse.summary}</Text>

          {journal.aiResponse.selfInsight && (
            <View style={styles.blurSection}>
              <Text style={styles.section}>Insight</Text>
              <View style={isSubscribed ? styles.insightContent : styles.insightContentPadded}>
                <Text style={styles.text}>{journal.aiResponse.selfInsight}</Text>
                {!isSubscribed && (
                  <BlurView intensity={12} tint="light" style={styles.blurOverlayInner}>
                    <TouchableOpacity onPress={navigateToUpgrade} disabled={upgradeLoading}>
                      <View style={styles.upgradeBlurButtonContent}>
                        {upgradeLoading ? (
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

          <View style={styles.statsRow}>
            <View style={styles.moodBox}>
              <Image
                source={pickFace(journal.aiResponse.moodScore)}
                style={{ width: 90, height: 90, resizeMode: 'contain' }}
                accessible
                accessibilityLabel="Mood"
              />
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Word Count</Text>
              <Text style={styles.statValue}>
                {journal.transcript.trim().split(/\s+/).length}
              </Text>
            </View>
          </View>

          {!!journal.aiResponse.feelings?.length && (
            <View style={styles.feelingsRow}>
              {journal.aiResponse.feelings.map((f, i) => (
                <View
                  key={`${f}-${i}`}
                  style={[
                    styles.feelingTag,
                    { backgroundColor: ['#D7ECFF', '#E4D7FF', '#CDEBEA'][i % 3] },
                    { borderColor: ['#abcdebff', '#bda7eaff', '#9edddbff'][i % 3] },
                  ]}
                >
                  <Text style={styles.feelingText}>{f}</Text>
                </View>
              ))}
            </View>
          )}

          {journal.aiResponse.thoughtPattern && (
            <View style={styles.blurSection}>
              <Text style={styles.section}>Thought Pattern</Text>
              <View style={isSubscribed ? styles.insightContent : styles.insightContentPadded}>
                <Text style={styles.text}>{journal.aiResponse.thoughtPattern}</Text>
                {!isSubscribed && (
                  <BlurView intensity={12} tint="light" style={styles.blurOverlayInner}>
                    <TouchableOpacity onPress={navigateToUpgrade} disabled={upgradeLoading}>
                      <View style={styles.upgradeBlurButtonContent}>
                        {upgradeLoading ? (
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

          <Text style={styles.section}>Next Step</Text>
          <Text style={styles.text}>{journal.aiResponse.nextStep}</Text>
        </ScrollView>
      )}
    </View>
  );
}

export default function JournalScreen() {
  return (
    <SafeAreaProvider>
      <JournalScreenInner />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fullscreen: { flex: 1, backgroundColor: colors.lightest },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lighter,
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
    fontFamily: 'SpaceMono',
  },
  content: { paddingHorizontal: 20 },
  section: {
    marginTop: 20,
    fontSize: 18,
    fontFamily: 'SpaceMono',
    fontWeight: '600',
    marginBottom: 6,
    color: colors.blue,
    borderBottomWidth: 1,
    borderBottomColor: colors.lighter,
    paddingBottom: 4,
  },
  text: { fontSize: 16, lineHeight: 26, color: '#333', fontFamily: 'SpaceMono' },
  block: {
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
    fontFamily: 'SpaceMono',
    backgroundColor: colors.lighter,
    padding: 12,
    borderRadius: 8,
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
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 30 },
  moodBox: {
    paddingHorizontal: 40,
    height: 120,
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
  },
  statBox: {
    height: 120,
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: colors.lighter,
    shadowOffset: { height: 0, width: 0 },
  },
  statLabel: { fontSize: 15, color: '#666', fontFamily: 'SpaceMono' },
  statValue: { fontSize: 20, fontWeight: '600', marginTop: 4, fontFamily: 'SpaceMono' },
  feelingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    gap: 10,
  },
  feelingTag: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  feelingText: { fontSize: 14, fontWeight: '500', color: '#333', fontFamily: 'SpaceMono' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
