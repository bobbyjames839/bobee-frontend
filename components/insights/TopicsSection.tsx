import React, { useContext } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { colors } from '~/constants/Colors';
import { SubscriptionContext } from '~/context/SubscriptionContext';

type Topic = { topic: string; count: number };

type Props = {
  topics: Topic[] | null; // pass null before data arrives, [] if none
};

export default function TopicsSection({ topics }: Props) {
  const { isSubscribed } = useContext(SubscriptionContext);
  const router = useRouter();

  const PARENT_HORIZONTAL_PADDING = 40;
  const CARD_HORIZONTAL_PADDING = 24;
  const windowWidth = Dimensions.get('window').width;
  const cardInnerWidth = windowWidth - PARENT_HORIZONTAL_PADDING - CARD_HORIZONTAL_PADDING;

  const dummyTopics: Topic[] = [
    { topic: 'Mindfulness', count: 10 },
    { topic: 'Stress', count: 7 },
    { topic: 'Goals', count: 5 },
  ];

  const topicsList = topics ?? []; // null -> treat as not loaded (will fall back below)
  const listToRender = topicsList.length > 0 ? topicsList : dummyTopics;

  const maxCount = listToRender[0].count;
  const totalItems = listToRender.length;

  // Determine if user has no topics with count > 0
  const hasNoTopics = isSubscribed && (topicsList.length === 0 || topicsList.every(t => t.count === 0));

  return (
    <>
      <Text style={styles.sectionTitle}>Common topics</Text>
      <View style={styles.card}>
        {listToRender.map((t, index) => {
          const fraction = t.count / maxCount;
          let barWidth = fraction * cardInnerWidth;

          const MIN_WIDTH = 60;
          if (barWidth < MIN_WIDTH) barWidth = MIN_WIDTH;
          if (barWidth > cardInnerWidth) barWidth = cardInnerWidth;

          const isDummy = topicsList.length === 0;
          const lightness = 40 + (index / totalItems) * 35;
          const barColor = isDummy
            ? colors.blue
            : `hsl(220, 90%, ${lightness}%)`;

          return (
            <View key={t.topic} style={styles.barRow}>
              {/* Topic name above the bar */}
              <Text style={styles.topicName}>{t.topic}</Text>
              <View style={[styles.topicBar, { width: barWidth, backgroundColor: barColor }]} />
            </View>
          );
        })}

        {!isSubscribed && (
          <BlurView intensity={12} tint="light" style={styles.overlay}>
            <View
              style={styles.subscribeButton}
              onTouchEnd={() => router.push('/settings/sub')}
            >
              <Text style={styles.subscribeText}>Subscribe</Text>
            </View>
          </BlurView>
        )}

        {hasNoTopics && (
          <BlurView intensity={12} tint="light" style={styles.overlay}>
            <View
              style={styles.subscribeButton}
              onTouchEnd={() => router.push('/journal')}
            >
              <Text style={styles.subscribeText}>Make a journal</Text>
            </View>
          </BlurView>
        )}
      </View>
    </>
  );
}

/* styles unchanged */
const styles = StyleSheet.create({
  topicName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
    marginBottom: 4,
    marginLeft: 4,
    fontFamily: 'SpaceMono',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
    color: '#222',
    marginBottom: 10,
    marginTop: 34,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 120,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lighter,
  },
  barRow: { marginBottom: 8 },
  topicBar: {
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 2,
  },
  topicText: { fontSize: 14, fontFamily: 'SpaceMono', flexShrink: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'white',
  },
  subscribeButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 50,
    paddingVertical: 10,
    borderRadius: 8,
  },
  subscribeText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SpaceMono',
    fontWeight: '600',
  },
});
