import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { colors } from '~/constants/Colors';
import { SubscriptionContext } from '~/context/SubscriptionContext';
import Svg, { G, Path, Circle } from 'react-native-svg';

type Topic = { topic: string; count: number };

type Props = {
  topics: Topic[] | null; // pass null before data arrives, [] if none
};

export default function TopicsSection({ topics }: Props) {
  const { isSubscribed } = useContext(SubscriptionContext);
  const router = useRouter();

  const dummyTopics: Topic[] = [
    { topic: 'Mindfulness', count: 10 },
    { topic: 'Stress', count: 7 },
    { topic: 'Goals', count: 5 },
  ];

  const topicsList = topics ?? []; // null -> treat as not loaded (will fall back below)
  const listToRender = topicsList.length > 0 ? topicsList : dummyTopics;

  const totalCount = listToRender.reduce((sum, t) => sum + t.count, 0) || 1; // avoid div by 0
  const hasNoTopics = isSubscribed && (topicsList.length === 0 || topicsList.every(t => t.count === 0));

  // Pie chart geometry
  const size = 220; // diameter
  const radius = size / 2;

  // Border styling for slices and outer ring
  const sliceStroke = '#d5d5d5ff' as const; // subtle dark gray
  const strokeWidth = 1;
  
  const slices = useMemo(() => {
    let cumulative = 0;

    // Define a nice categorical palette
    const palette = [
      "#757ef8ff", "#2b2ef2ff", "#575ee1ff", "#be93f7ff",
      "#9062f3ff"
    ];

    return listToRender.map((t, idx) => {
      const value = t.count;
      const fraction = value / totalCount;
      const startAngle = cumulative * 2 * Math.PI;
      cumulative += fraction;
      const endAngle = cumulative * 2 * Math.PI;
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

      const x1 = radius + radius * Math.sin(startAngle);
      const y1 = radius - radius * Math.cos(startAngle);
      const x2 = radius + radius * Math.sin(endAngle);
      const y2 = radius - radius * Math.cos(endAngle);

      const path = `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      // Pick color from palette (wrap around if more slices than colors)
      const fill = palette[idx % palette.length];

      return { topic: t.topic, value, fraction, path, fill };
    });
  }, [listToRender, totalCount, radius]);


  const legend = slices.slice(0, 6); // show up to 6 legend rows

  return (
    <>
      <Text style={styles.sectionTitle}>Common topics</Text>
      <View style={styles.card}>
        <View style={styles.pieWrapper}>
          <Svg width={size} height={size}>
            <G>
              {slices.map(s => (
                <Path
                  key={s.topic}
                  d={s.path}
                  fill={s.fill}
                  stroke={sliceStroke}
                  strokeWidth={strokeWidth}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}

              {/* Outer ring */}
              <Circle
                cx={radius}
                cy={radius}
                r={radius - strokeWidth / 2}
                fill="none"
              />
            </G>
          </Svg>
        </View>

        <View style={styles.legend}>
          {legend.map(s => (
            <View key={s.topic} style={styles.legendRow}>
              <View style={[styles.legendSwatch, { backgroundColor: s.fill }]} />
              <Text style={styles.legendText} numberOfLines={1}>{s.topic}</Text>
            </View>
          ))}
          {slices.length > legend.length && (
            <Text style={styles.moreLabel}>+{slices.length - legend.length} more</Text>
          )}
        </View>

        {/* Overlays unchanged */}
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'SpaceMonoSemibold',
    color: '#222',
    marginBottom: 10,
    marginTop: 34,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 0,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 120,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.lighter,
    flexDirection: 'row',
    alignItems: 'center'
  },
  pieWrapper: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legend: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center'
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendSwatch: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'SpaceMono',
    color: '#333',
  },
  legendCount: {
    fontSize: 13,
    fontFamily: 'SpaceMono',
    color: '#555',
    marginLeft: 6,
  },
  moreLabel: {
    fontSize: 12,
    fontFamily: 'SpaceMono',
    color: '#666',
    marginTop: 4,
  },
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
