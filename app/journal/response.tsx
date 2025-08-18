import React, { useContext, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SubscriptionContext } from '~/context/SubscriptionContext';
import { colors } from '~/constants/Colors';
import { useJournalContext } from '~/context/JournalContext'; 
import Header from '~/components/other/Header';
import SpinningLoader from '~/components/other/SpinningLoader';

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

const feelingColors  = ['#B3DFFC', '#D1C4E9', '#B2DFDB'];
const feelingBorders = ['#89c5eeff', '#b89ee8ff', '#8de2dbff'];
const feelingColor   = (i: number) => feelingColors[i % feelingColors.length];
const feelingBorder  = (i: number) => feelingBorders[i % feelingBorders.length];

export default function ResponseScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { isSubscribed } = useContext(SubscriptionContext);
  const journal = useJournalContext(); // ✅ shared state/actions

  // waiting for response
  if (!journal.aiResponse) {
    return (
      <View style={styles.pageWrapper}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.iconWrap} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back-ios-new" size={24} color="#222" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Journal Response</Text>
          <View style={styles.iconWrap} />
        </View>
        <View style={styles.loaderWrap}>
          <SpinningLoader size={40} />
          <Text style={styles.loaderText}>Preparing response…</Text>
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
  const onUpgrade    = async () => { await journal.handleUpgrade(); };
  const onUpgradeTwo = async () => { await journal.handleUpgradeTwo(); };

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
        title="Conversation"
        leftIcon="chevron-back"
        onLeftPress={() => (router.back(), doResetOnce())}/>

      {/* Content */}
      <View style={styles.pagePadding}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.responseBox}>
            <View style={styles.cornerBadgeContainer}>
              <View
                style={[
                  styles.cornerBadgeTriangle,
                  { backgroundColor: isSubscribed ? colors.blue : colors.light },
                ]}
              />
              <Text style={styles.cornerBadgeText}>
                {isSubscribed ? 'Pro' : 'Free'}
              </Text>
            </View>

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
                <View style={isSubscribed ? styles.insightContent : styles.insightContentPadded}>
                  <Text style={styles.responseText}>{aiResponse.selfInsight}</Text>
                  {!isSubscribed && (
                    <BlurView intensity={12} tint="light" style={styles.blurOverlayInner}>
                      <TouchableOpacity onPress={onUpgrade} disabled={journal.subscribeLoading}>
                        <View style={styles.upgradeBlurButtonContent}>
                          {journal.subscribeLoading ? (
                            <SpinningLoader size={24} thickness={3} color='white'/>
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
                <View style={isSubscribed ? styles.insightContent : styles.insightContentPadded}>
                  <Text style={styles.responseText}>{aiResponse.thoughtPattern}</Text>
                  {!isSubscribed && (
                    <BlurView intensity={12} tint="light" style={styles.blurOverlayInner}>
                      <TouchableOpacity onPress={onUpgradeTwo} disabled={journal.secondSubscribeLoading}>
                        <View style={styles.upgradeBlurButtonContent}>
                          {journal.secondSubscribeLoading ? (
                            <SpinningLoader size={24} thickness={3} color='white'/>
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

            <Text style={styles.sectionTitle}>Next Step</Text>
            <Text style={styles.responseText}>{aiResponse.nextStep}</Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.submitButton, journal.submitLoading && { opacity: 0.6 }]}
                onPress={onSubmit}
                disabled={journal.submitLoading}
              >
                {journal.submitLoading ? (
                  <SpinningLoader size={24} thickness={3} color='white'/>
                ) : (
                  <Text style={styles.submitButtonText}>Submit Journal</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton}   
                onPress={() => {
                router.back();
              }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // NEW: page wrapper + navbar + side padding + loader styles
  pageWrapper: {
    flex: 1,
    backgroundColor: colors.lightest,
  },
  navBar: {
    height: 90,
    paddingTop: 45,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  iconWrap: { width: 28, alignItems: 'flex-start' },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
    fontFamily: 'SpaceMono',
  },
  pagePadding: {
    flex: 1,
    paddingHorizontal: 20, // side margins
  },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { marginTop: 12, color: '#555', fontFamily: 'SpaceMono' },

  // Original component styles (unchanged)
  scrollContainer: {
    paddingBottom: 30,
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
  responseBox: {
    backgroundColor: '#FAFAFA',
    padding: 14,
    paddingTop: 24,
    borderRadius: 16,
    borderWidth: 1, 
    borderColor: colors.lighter
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
  blurSection: {
    position: 'relative',
  },
  insightContentPadded: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(173, 209, 246, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  insightContent: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  blurOverlayInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(155, 203, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBlurButtonContent: {
    display: 'flex',
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
  moodRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
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
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    gap: 7,
    justifyContent: 'space-between'
  },
  submitButton: {
    backgroundColor: colors.blue,
    height: 42,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    width: '70%'
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
  cancelButton: {
    backgroundColor: colors.lighter,
    flex: 1,
    height: 42,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.light,
  },
  cancelButtonText: {
    color: colors.dark,
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
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
});
