import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '~/constants/Colors';
import { useJournalContext } from '~/context/JournalContext'; 
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

function pickFace(score: number) {
  if (score <= 2) return FACE_VERY_SAD;
  if (score <= 4) return FACE_SAD;
  if (score <= 6) return FACE_NEUTRAL;
  if (score <= 8) return FACE_SLIGHTLY_HAPPY;
  return FACE_VERY_HAPPY;
}

const feelingColors  = ['#B3DFFC', '#D1C4E9', '#B2DFDB'];
const feelingBorders = ['#89c5eeff', '#b89ee8ff', '#8de2dbff'];
const feelingColor   = (i: number) => feelingColors[i % feelingColors.length];
const feelingBorder  = (i: number) => feelingBorders[i % feelingBorders.length];

export default function ResponseScreen() {
  const router = useRouter();
  const journal = useJournalContext(); // ✅ shared state/actions

  // waiting for response
  if (!journal.aiResponse) {
    return (
      <View style={styles.pageWrapper}>
        <View style={styles.loaderWrap}>
          <SpinningLoader size={40} />
          <TouchableOpacity style={styles.submitButton} onPress={() => router.back()}>
            <Text style={styles.submitButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }


  const aiResponse    = journal.aiResponse;
  const transcript    = journal.transcript ?? '';
  const prompt        = journal.prompt ?? '';
  const wordCount     = journal.wordCount ?? 0;
  const currentStreak = journal.currentStreak ?? 0;
  const face          = pickFace(aiResponse.moodScore);

  const onSubmit     = async () => { await journal.handleSubmitJournal(); };

  const hasResetRef = useRef(false);
  const doResetOnce = () => {
    if (hasResetRef.current) return;
    hasResetRef.current = true;
    journal.resetState();
  };

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        doResetOnce();
      };
    }, [])
  );

  return (
    <View style={styles.pageWrapper}>
      <Header
        title="Response"
        rightIcon="close"
        onRightPress={() => (router.back(), doResetOnce())}/>

      {/* Content */}
      <View style={styles.pagePadding}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {prompt ? (
              <>
                <Text style={styles.sectionTitleTop}>Prompt</Text>
                <Text style={styles.responseText}>{prompt}</Text>
                <Text style={styles.sectionTitle}>Transcript</Text>
                <Text style={styles.block}>{transcript}</Text>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitleTop}>Transcript</Text>
                <Text style={styles.block}>{transcript}</Text>
              </>
            )}

            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.responseText}>{aiResponse.summary}</Text>

            {!!aiResponse.selfInsight && (
              <View style={styles.blurSection}>
                <Text style={styles.sectionTitle}>Insight</Text>
                <View style={styles.insightContent}>
                  <Text style={styles.responseText}>{aiResponse.selfInsight}</Text>
                </View>
              </View>
            )}
            
            <View style={styles.personalityDeltaRow}>
              {PERSONALITY_KEYS.map((key) => {
                const delta = aiResponse.personalityDeltas?.[key] || 0;
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

            <View style={styles.moodRowContainer}>
              <View style={styles.moodBox}>
                <Image
                  source={face}
                  style={{ width: 104, height: 104, resizeMode: 'contain' }}
                  accessible
                  accessibilityLabel="Mood"
                />
              </View>
              <View style={styles.rightBoxesContainer}>
                <View style={[styles.statBox, styles.statBoxTop]}>
                  <Text style={styles.statLabel}>Word Count</Text>
                  <Text style={styles.statValue}>{wordCount}</Text>
                </View>
                <View style={[styles.statBox, styles.statBoxBottom]}>
                  <Text style={styles.statLabel}>Current Streak</Text>
                  <Text style={styles.statValue}>
                    {currentStreak} day{currentStreak !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.feelingsRow}>
              {aiResponse.feelings.map((word, i) => (
                <View
                  key={`${word}-${i}`}
                  style={[
                    styles.feelingBox,
                    { backgroundColor: feelingColor(i) },
                    { borderColor: feelingBorder(i) },
                  ]}
                >
                  <Text style={styles.feelingText}>{word}</Text>
                </View>
              ))}
            </View>

            {!!aiResponse.thoughtPattern && (
              <View style={styles.blurSection}>
                <Text style={styles.sectionTitle}>Thought Pattern</Text>
                <View style={styles.insightContent}>
                  <Text style={styles.responseText}>{aiResponse.thoughtPattern}</Text>
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>Next Step</Text>
            <Text style={styles.responseText}>{aiResponse.nextStep}</Text>

        </ScrollView>

      </View>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={onSubmit}
        >
          <Text style={styles.submitButtonText}>Submit Journal</Text>
        </TouchableOpacity>

      {journal.submitLoading && (
        <BlurView intensity={15} style={styles.blurOverlay}>
          <SpinningLoader size={40} />
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pageWrapper: {
    flex: 1,
    backgroundColor: colors.lightest,
  },
  pagePadding: {
    flex: 1,
    paddingHorizontal: 20, // side margins
  },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { marginTop: 12, color: '#555', fontFamily: 'SpaceMono' },

  // Original component styles (unchanged)
  scrollContainer: {
    paddingBottom: 90,
    marginTop: 20,
  },
  block: {
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
    fontFamily: 'SpaceMono',
    backgroundColor: colors.lighter,
    padding: 12,
    borderRadius: 8,
  },
  sectionTitle: {
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
  sectionTitleTop: {
    marginTop: 5,
    fontSize: 18,
    fontFamily: 'SpaceMono',
    fontWeight: '600',
    marginBottom: 6,
    color: colors.blue,
    borderBottomWidth: 1,
    borderBottomColor: colors.lighter,
    paddingBottom: 4,
  },
  responseText: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: 'SpaceMono',
    color: '#444',
  },
  blurSection: {
    position: 'relative',
  },
  insightContent: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  moodRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
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
    shadowOffset: {height: 0, width: 0},
    elevation: 0
  },
  rightBoxesContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: {height: 0, width: 0},
    elevation: 0,
    borderWidth: 1,
    borderColor: colors.lighter,
  },
  statBoxTop: {
    marginBottom: 5,
  },
  statBoxBottom: {
    marginTop: 5,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
    color: '#333333',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: 'SpaceMono',
  },
  feelingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    gap: 10
  },
  feelingBox: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lighter,
  },
  feelingText: {
    color: 'black',
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
  submitButton: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: colors.blue,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'SpaceMonoSemibold',
  },
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
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
