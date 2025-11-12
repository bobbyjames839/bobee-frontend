import React, { useState } from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import * as d3 from 'd3-shape';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import AnimatedToggle from './AnimatedToggle';
import { colors } from '~/constants/Colors';

type RangeKey = '7d' | '28d';
interface MoodSeries { labels: string[]; values: Array<number | null> }
export type SeriesResponse = Record<RangeKey, MoodSeries>;

type Props = {
  series: SeriesResponse;
};

export default function MoodChart({ series }: Props) {
  const router = useRouter();

  const [range, setRange] = useState<RangeKey>('7d');

  const cardWidth = Dimensions.get('window').width - 60;

  // chart paddings
  const padTop = 12;
  const padBottom = 28;
  const padLeft = 12;
  const padRight = 22;

  const dotRadius = 5;
  const chartHeight = 260;

  // Enforce exact window size on the client
  const full = series?.[range] || { labels: [], values: [] };
  const windowSize = range === '7d' ? 7 : 28;
  const labels = full.labels.slice(-windowSize);
  const values = full.values.slice(-windowSize);

  const hasAny = values.some(v => v != null);

  // Build a line that connects across nulls while keeping time spacing
const buildLine = (vals: Array<number | null>) => {
  const n = vals.length;

  const innerW = Math.max(0, cardWidth - padLeft - padRight);
  const innerH = Math.max(0, chartHeight - padTop - padBottom);

  const xStep = n > 1 ? innerW / (n - 1) : 0;

  // numbers only
  const nums = vals.filter((v): v is number => v != null);

  // default domain if no data
  let minY = nums.length ? Math.min(...nums) : 0;
  let maxY = nums.length ? Math.max(...nums) : 1;

  // add vertical padding (top only so the baseline stays tight)
  const topPaddingPct = 0.1; // 10% headroom
  const span = Math.max(1e-6, maxY - minY); // avoid zero span
  const minYp = minY;                       // no bottom padding
  const maxYp = maxY + span * topPaddingPct;

  const yRange = maxYp - minYp;

  const points = vals.map((v, i) => {
    const x = padLeft + i * xStep;
    const y =
      v == null
        ? 0
        : padTop + (1 - (v - minYp) / yRange) * innerH;
    return { i, v, x, y };
  });

  const definedPoints = points.filter(
    p => p.v != null
  ) as Array<typeof points[number] & { v: number }>;

  const line = d3
    .line<typeof definedPoints[number]>()
    .x(d => d.x)
    .y(d => d.y)
    .curve(d3.curveCatmullRom.alpha(0.1)); // keep your current curve

  return { definedPoints, path: line(definedPoints) || '', xStep };
};


  let content: React.ReactNode;

  if (!hasAny) {
    // Dummy soft chart encouraging first journal
    const dummyValues = [3, 5, 4, 6, 5, 7, 6];
    const { definedPoints: dummyPts, path: dummyPath } = buildLine(dummyValues);

    content = (
      <View style={[styles.card, styles.fixedChartHeight]}>
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <Svg width={cardWidth} height={chartHeight}>
            <Path d={dummyPath} stroke="rgba(101, 122, 241, 0.35)" strokeWidth={4} fill="none" />
            {dummyPts.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={dotRadius} fill="rgba(101, 122, 241, 0.5)" />
            ))}
          </Svg>
        </View>

        <BlurView intensity={16} tint="light" style={styles.overlay}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)/journal')}
          >
            <Text style={styles.primaryButtonText}>Make journal</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    );
  } else {
    const { definedPoints, path, xStep } = buildLine(values);

    content = (
      <View style={styles.card}>
        <View style={{ alignItems: 'center', paddingBottom: 20 }}>
          <Svg width={cardWidth} height={chartHeight}>
            {/* Joined line across missing days */}
            <Path d={path} stroke="rgba(172, 166, 255, 0.3)" strokeWidth={4} fill="none" />

            {/* Data points */}
            {definedPoints.map((p, j) => (
              <Circle key={j} cx={p.x} cy={p.y} r={dotRadius} fill={colors.blue} />
            ))}

            {/* X-axis labels */}
            {labels.map((lab, i) => (
              <SvgText
                key={i}
                x={padLeft + i * xStep}
                y={chartHeight - 6}
                fontSize="10"
                fill="#666"
                textAnchor="middle"
              >
                {lab}
              </SvgText>
            ))}
          </Svg>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mood over time</Text>
        {hasAny && (
          <View style={styles.toggleRow}>
            <AnimatedToggle label="1W" active={range === '7d'} onPress={() => setRange('7d')} />
            <AnimatedToggle label="4W" active={range === '28d'} onPress={() => setRange('28d')} />
          </View>
        )}
      </View>

      {content}
    </View>
  );
}

/* styles unchanged */
const styles = StyleSheet.create({
  container: { marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 20, fontWeight: '600', fontFamily: 'SpaceMonoSemibold' },
  toggleRow: { flexDirection: 'row' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.lighter,
  },
  fixedChartHeight: {
    height: 260,
    justifyContent: 'center',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  primaryButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 50,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
});
