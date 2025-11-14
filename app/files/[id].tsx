import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import useJournals, { JournalEntry } from '~/hooks/useFiles';
import { colors } from '~/constants/Colors';
import Header from '~/components/other/Header';
import SpinningLoader from '~/components/other/SpinningLoader';
import { Brain, CheckCircle, Heart, AlertCircle, Lightbulb, ShieldCheck, ArrowUp, ArrowDown } from 'lucide-react-native';

const FACE_VERY_SAD        = require('~/assets/images/verysad.png');
const FACE_SAD             = require('~/assets/images/sad.png');
const FACE_NEUTRAL         = require('~/assets/images/mid.png');
const FACE_SLIGHTLY_HAPPY  = require('~/assets/images/happy.png');
const FACE_VERY_HAPPY      = require('~/assets/images/veryhappy.png');

const PERSONALITY_KEYS = ['resilience', 'discipline', 'focus', 'selfWorth', 'confidence', 'clarity'] as const;
const ICONS = { resilience: AlertCircle, discipline: CheckCircle, focus: Brain, selfWorth: Heart, confidence: ShieldCheck, clarity: Lightbulb };
const LABELS: Record<string, string> = { resilience: 'Resilience', discipline: 'Discipline', focus: 'Focus', selfWorth: 'Self-Worth', confidence: 'Confidence', clarity: 'Purpose' };

function pickFace(score: number) {
  if (score <= 2) return FACE_VERY_SAD;
  if (score <= 4) return FACE_SAD;
  if (score <= 6) return FACE_NEUTRAL;
  if (score <= 8) return FACE_SLIGHTLY_HAPPY;
  return FACE_VERY_HAPPY;
}

export default function JournalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getJournalById } = useJournals();
  const insets = useSafeAreaInsets();
  const [journal, setJournal] = useState<JournalEntry | undefined>(undefined);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const cachedJournal = getJournalById(id);
    if (cachedJournal) {
      setJournal(cachedJournal);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [id, getJournalById]);


  return (
    <View style={styles.fullscreen}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      <Header
        title="Journal Details"
        leftIcon="chevron-back"
        onLeftPress={() => router.back()}
      />

      {loading ? (
        <View style={styles.center}>
          <SpinningLoader size={40} />
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
              <View style={styles.insightContent}>
                <Text style={styles.text}>{journal.aiResponse.selfInsight}</Text>
              </View>
            </View>
          )}
          
          <View style={styles.personalityDeltaRow}>
            {PERSONALITY_KEYS.map((key) => {
              const delta = journal.aiResponse.personalityDeltas?.[key] || 0;
              const IconComp = ICONS[key as keyof typeof ICONS];
              
              return (
                <View key={key} style={styles.personalityDeltaBox}>
                  <IconComp color={colors.blue} size={24} strokeWidth={2} />
                  {delta !== 0 ? (
                    <View style={styles.deltaBadge}>
                      {delta > 0 ? <ArrowUp size={14} color="white" /> : <ArrowDown size={14} color="white" />}
                      <Text style={styles.deltaText}>{Math.abs(delta)}</Text>
                    </View>
                  ) : (
                    <View style={styles.emptyDeltaBadge}>
                      <Text style={styles.emptyDeltaText}>0</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

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
              <View style={styles.insightContent}>
                <Text style={styles.text}>{journal.aiResponse.thoughtPattern}</Text>
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

const styles = StyleSheet.create({
  fullscreen: { flex: 1, backgroundColor: colors.lightest },
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
  insightContent: { position: 'relative', borderRadius: 8, overflow: 'hidden' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  blurSection: { position: 'relative' },
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
  personalityDeltaRow: {
    marginTop: 30,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    paddingHorizontal: 5,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: colors.lighter,
    shadowOffset: { height: 0, width: 0 },
  },
  personalityDeltaBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deltaBadge: {
    backgroundColor: colors.blue,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 2,
  },
  emptyDeltaBadge: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: 'center',
    marginTop: 5,
  },
  deltaText: {
    fontSize: 13,
    color: 'white',
    fontWeight: '600',
    fontFamily: 'SpaceMono',
  },
  emptyDeltaText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    fontFamily: 'SpaceMono',
  },
  iconLabel: {
    fontSize: 10,
    fontFamily: 'SpaceMono',
    color: '#555',
    marginTop: 2,
  },
});
