import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Platform,
  UIManager,
  FlatList,
  Dimensions,
  ScrollView,
} from 'react-native';
import Svg, { Polygon, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import useJournals, { JournalEntry } from '~/hooks/useFiles';
import { colors } from '~/constants/Colors';
import SpinningLoader from '~/components/other/SpinningLoader';
import DeleteConfirmModal from '~/components/other/DeleteConfirmModal';
import * as Haptics from 'expo-haptics';
import {
  Brain,
  CheckCircle,
  Heart,
  AlertCircle,
  Lightbulb,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  X,
  Trash2,
} from 'lucide-react-native';

const FACE_VERY_SAD = require('~/assets/images/verysad.png');
const FACE_SAD = require('~/assets/images/sad.png');
const FACE_NEUTRAL = require('~/assets/images/mid.png');
const FACE_SLIGHTLY_HAPPY = require('~/assets/images/happy.png');
const FACE_VERY_HAPPY = require('~/assets/images/veryhappy.png');

const PERSONALITY_KEYS = [
  'resilience',
  'discipline',
  'focus',
  'selfWorth',
  'confidence',
  'clarity',
] as const;

const ICONS = {
  resilience: AlertCircle,
  discipline: CheckCircle,
  focus: Brain,
  selfWorth: Heart,
  confidence: ShieldCheck,
  clarity: Lightbulb,
};

function pickFace(score: number) {
  if (score <= 2) return FACE_VERY_SAD;
  if (score <= 4) return FACE_SAD;
  if (score <= 6) return FACE_NEUTRAL;
  if (score <= 8) return FACE_SLIGHTLY_HAPPY;
  return FACE_VERY_HAPPY;
}

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type SectionKey = 'summary' | 'insight' | 'thoughtPattern' | 'nextStep';

type SectionItem = {
  key: SectionKey;
  label: string;
  content: string;
};

const SECTION_LABELS: Record<SectionKey, string> = {
  summary: 'Summary',
  insight: 'Insight',
  thoughtPattern: 'Thought Pattern',
  nextStep: 'Next Step',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.8; // main card spans ~80% of screen
const SNAP_INTERVAL = CARD_WIDTH; // distance between centers

function formatDateAndTime(timestamp: any) {
  try {
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const minutesStr = minutes.toString().padStart(2, '0');
    
    return `${month} ${day}, ${hours}:${minutesStr} ${ampm}`;
  } catch {
    return 'NOVEMBER 15, 1:12 PM';
  }
}

export default function JournalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getJournalById, deleteJournal } = useJournals();
  const insets = useSafeAreaInsets();
  const [journal, setJournal] = useState<JournalEntry | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const carouselRef = useRef<FlatList<SectionItem> | null>(null);
  

  useEffect(() => {
    const cachedJournal = getJournalById(id);
    if (cachedJournal) {
      setJournal(cachedJournal);
    }
    setLoading(false);
  }, [id, getJournalById]);

  const baseSections: SectionItem[] =
    journal != null
      ? [
          {
            key: 'summary',
            label: SECTION_LABELS.summary,
            content: journal.aiResponse.summary || 'No summary available.',
          },
          {
            key: 'insight',
            label: SECTION_LABELS.insight,
            content:
              journal.aiResponse.selfInsight ||
              'No personal insight was generated for this entry.',
          },
          {
            key: 'thoughtPattern',
            label: SECTION_LABELS.thoughtPattern,
            content:
              journal.aiResponse.thoughtPattern ||
              'No thought pattern analysis was generated for this entry.',
          },
          {
            key: 'nextStep',
            label: SECTION_LABELS.nextStep,
            content:
              journal.aiResponse.nextStep ||
              'No next step suggestion was generated for this entry.',
          },
        ]
      : [];

  const baseLen = baseSections.length;
  const loopSections: SectionItem[] = baseLen
    ? [...baseSections, ...baseSections, ...baseSections]
    : [];
  const middleOffset = baseLen;

  useEffect(() => {
    if (baseLen && carouselRef.current) {
      setCurrentIndex(middleOffset);
      setTimeout(() => {
        carouselRef.current?.scrollToIndex({
          index: middleOffset,
          animated: false,
        });
      }, 0);
    }
  }, [baseLen, middleOffset]);

  const handleMomentumEnd = (event: any) => {
    if (!baseLen) return;

    const offsetX = event.nativeEvent.contentOffset.x;
    let index = Math.round(offsetX / SNAP_INTERVAL);

    if (index < baseLen || index >= baseLen * 2) {
      const normalized = ((index - baseLen) % baseLen + baseLen) % baseLen;
      index = baseLen + normalized;
      carouselRef.current?.scrollToIndex({ index, animated: false });
    }

    setCurrentIndex(index);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteJournal(id, false);
      setShowDeleteModal(false);
      router.back();
    } catch (e) {
      console.error('Delete failed:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.fullscreen}>

      <View style={styles.bottomCircle}></View>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            setShowDeleteModal(true);
          }}
          activeOpacity={0.7}
          style={styles.deleteButtonTouchable}
        >
          <Trash2 size={24} color={colors.dark} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.dateText}>
          {journal ? formatDateAndTime(journal.createdAt) : 'NOVEMBER 15, 1:12 PM'}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={styles.closeButtonTouchable}
        >
          <X size={24} color={colors.dark} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <SpinningLoader size={40} />
        </View>
      ) : !journal ? (
        <View style={styles.center}>
          <Text>Couldn’t find this entry.</Text>
        </View>
      ) : (
        <View
          style={[
            styles.contentContainer,
            { paddingBottom: insets.bottom || 20 },
          ]}
        >
          {/* TOP: prompt + answer */}
          <View style={styles.innerContentTop}>
            {!!journal.prompt?.trim() && (
              <Text style={styles.title}>{journal.prompt}</Text>
            )}

            <Text style={styles.answer}>{journal.transcript}</Text>
          </View>

          {/* MIDDLE: should always sit between top and bottom, vertically centered */}
          <View style={styles.middle}>
            <Image
              source={pickFace(journal.aiResponse.moodScore)}
              style={styles.moodImage}
              accessible
              accessibilityLabel="Mood"
            />

            <View style={styles.personalityDeltaRow}>
              {PERSONALITY_KEYS.map((key) => {
                const delta = journal.aiResponse.personalityDeltas?.[key] || 0;
                const IconComp = ICONS[key as keyof typeof ICONS];

                return (
                  <View key={key} style={styles.personalityDeltaBox}>
                    <IconComp color={colors.blue} size={24} strokeWidth={2} />
                    {delta !== 0 ? (
                      <View style={styles.deltaBadge}>
                        {delta > 0 ? (
                          <ArrowUp size={14} color="white" />
                        ) : (
                          <ArrowDown size={14} color="white" />
                        )}
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

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Word Count</Text>
              <Text style={styles.statValue}>
                {journal.transcript.trim().split(/\s+/).length}
              </Text>
            </View>

            {!!journal.aiResponse.feelings?.length && (
              <View style={styles.feelingsRow}>
                {journal.aiResponse.feelings.map((f, i) => (
                  <View
                    key={`${f}-${i}`}
                    style={[
                      styles.feelingTag,
                      {
                        backgroundColor: ['#D7ECFF', '#d7e2ffff', '#c2cbffff'][
                          i % 3
                        ],
                      }
                    ]}
                  >
                    <Text style={styles.feelingText}>{f}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* BOTTOM: carousel, fixed near bottom, in normal flow */}
          {baseLen > 0 && (
            <View style={styles.insightsSection}>
              <Animated.FlatList<SectionItem>
                ref={carouselRef}
                data={loopSections}
                keyExtractor={(item, index) => `${item.key}-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={SNAP_INTERVAL}
                decelerationRate="fast"
                bounces={false}
                contentContainerStyle={{
                  paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
                }}
                onMomentumScrollEnd={handleMomentumEnd}
                getItemLayout={(_, index) => ({
                  length: SNAP_INTERVAL,
                  offset: SNAP_INTERVAL * index,
                  index,
                })}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                renderItem={({ item, index }) => {
                  const inputRange = [
                    (index - 1) * SNAP_INTERVAL,
                    index * SNAP_INTERVAL,
                    (index + 1) * SNAP_INTERVAL,
                  ];

                  const scale = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.9, 1, 0.9],
                    extrapolate: 'clamp',
                  });

                  const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.5, 1, 0.5],
                    extrapolate: 'clamp',
                  });

                  return (
                    <Animated.View
                      style={[
                        styles.insightsCard,
                        {
                          width: CARD_WIDTH,
                          transform: [{ scale }],
                          opacity,
                        },
                      ]}
                    >
                      <Svg
                        pointerEvents="none"
                        style={styles.bgSpan}
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        <Defs>
                          <LinearGradient id={`bgGrad-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={colors.blue} stopOpacity={0.08} />
                            <Stop offset="1" stopColor={colors.blue} stopOpacity={0.02} />
                          </LinearGradient>
                        </Defs>
                        <Polygon points="0,0 100,0 60,100 0,100" fill={`url(#bgGrad-${index})`} />
                      </Svg>
                      <Text style={styles.insightsTitleInside}>
                        {item.label}
                      </Text>
                      <ScrollView
                        style={styles.insightsContentScrollView}
                        contentContainerStyle={styles.insightsContentContainer}
                        showsVerticalScrollIndicator={false}
                      >
                        <Text style={styles.insightsContentText}>
                          {item.content}
                        </Text>
                      </ScrollView>
                    </Animated.View>
                  );
                }}
              />
            </View>
          )}
        </View>
      )}

      <DeleteConfirmModal
        visible={showDeleteModal}
        title="Delete Journal?"
        message="This action cannot be undone."
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: { flex: 1, backgroundColor: colors.lightest, overflow: 'hidden' },

  header: {
    paddingHorizontal: 30,
    paddingTop: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10
  },
  deleteButtonTouchable: {
    height: 42,
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5b3b3ff',
    borderRadius: 10,
  },
  dateText: {
    color: colors.light,
    fontFamily: 'SpaceMonoBold',
    letterSpacing: 1,
  },
  closeButtonTouchable: {
    height: 42,
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
  },

  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },

  innerContentTop: {
    // top block (prompt + answer) has natural height
  },

  title: {
    fontSize: 16,
    marginTop: 25,
    color: colors.darkest,
    textAlign: 'center',
    fontFamily: 'SpaceMonoSemibold',
    zIndex: 10
  },
  answer: {
    marginTop: 15,
    width: '90%',
    alignSelf: 'center',
    fontSize: 15,
    lineHeight: 23,
    color: colors.dark,
    fontFamily: 'SpaceMono',
    maxHeight: 100,
    zIndex: 10,
    overflow: 'scroll',
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  middle: {
    flex: 1, // this is what makes it occupy remaining space
    alignItems: 'center',
    justifyContent: 'center', // centers within remaining height
  },

  moodImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: '-50%' }],
    left: -80,
    opacity: 0.4,
  },

  statBox: {
    height: 70,
    width: '70%',
    alignSelf: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginVertical: 12,
  },
  statLabel: { fontSize: 15, color: '#666', fontFamily: 'SpaceMono' },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 4,
    fontFamily: 'SpaceMono',
    alignSelf: 'flex-end',
  },

  feelingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    alignSelf: 'flex-end',
    width: '87%',
  },
  feelingTag: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feelingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'SpaceMono',
  },

  personalityDeltaRow: {
    width: '81%',
    alignSelf: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    paddingVertical: 14,
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

  insightsSection: {
    marginHorizontal: -20,
  },
  insightsCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    height: 250,
    alignSelf: 'center',
  },
  bgSpan: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '80%',
    zIndex: 0,
  },
  insightsTitleInside: {
    fontFamily: 'SpaceMonoSemibold',
    fontSize: 16,
    textAlign: 'center',
    color: colors.darkest,
    marginBottom: 8,
    zIndex: 1,
  },
  insightsContentScrollView: {
    flex: 1,
    zIndex: 1,
  },
  insightsContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  insightsContentText: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.dark,
  },
  bottomCircle: {
    position: 'absolute',
    top: -450,
    width: 650,
    right: '50%',
    transform: [{ translateX: 325 }],
    height: 650,
    borderRadius: 525,
    backgroundColor: '#eeebfcff',
  },
});
