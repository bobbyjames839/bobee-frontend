import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import * as d3 from 'd3-shape';
import Constants from 'expo-constants';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import AnimatedToggle from './AnimatedToggle';
import Placeholder from './Placeholder';
import { colors } from '~/constants/Colors';

type RangeKey = '7d' | '28d';
interface MoodSeries { labels: string[]; values: Array<number | null> }
type SeriesResponse = Record<RangeKey, MoodSeries>;

export default function MoodChart() {
  const router = useRouter();

  const [range, setRange] = useState<RangeKey>('7d');
  const [series, setSeries] = useState<SeriesResponse>({
    '7d': { labels: [], values: [] },
    '28d': { labels: [], values: [] },
  });
  const [loading, setLoading] = useState(true);

  const cardWidth = Dimensions.get('window').width - 60;

  // chart paddings – give a bit more space on the right so the last label isn't clipped
  const padTop = 12;
  const padBottom = 28; // room for x-axis labels
  const padLeft = 12;
  const padRight = 22;  // extra space to prevent the rightmost label from being cut off

  const dotRadius = 5;
  const chartHeight = 260;

  useEffect(() => {
    let mounted = true;
    const fetchSeries = async () => {
      try {
        const user = getAuth().currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetch(
          `${Constants.expoConfig?.extra?.backendUrl}/api/mood-chart-stats`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: SeriesResponse = await res.json();
        if (mounted) setSeries(data);
      } catch (err) {
        console.error('Failed to fetch mood series:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSeries();
    return () => { mounted = false; };
  }, []);

  // Enforce exact window size on the client
  const full = series[range];
  const windowSize = range === '7d' ? 7 : 28;
  const labels = full.labels.slice(-windowSize);
  const values = full.values.slice(-windowSize);

  const hasAny = values.some(v => v != null);

  // Build a line that connects across nulls while keeping time spacing
  const buildLine = (vals: Array<number | null>) => {
    const n = vals.length;

    // Inner plotting width/height
    const innerW = Math.max(0, (cardWidth - padLeft - padRight));
    const innerH = Math.max(0, (chartHeight - padTop - padBottom));

    const xStep = n > 1 ? innerW / (n - 1) : 0;

    const nums = vals.filter((v): v is number => v != null);
    const minY = nums.length ? Math.min(...nums) : 0;
    const maxY = nums.length ? Math.max(...nums) : 1;
    const yRange = maxY - minY || 1;

    // all points (for circles + labels)
    const points = vals.map((v, i) => {
      const x = padLeft + i * xStep;
      const y = v == null
        ? 0
        : padTop + (1 - (v - minY) / yRange) * innerH;
      return { i, v, x, y };
    });

    // only defined points (for the joined line)
    const definedPoints = points.filter(p => p.v != null) as Array<typeof points[number] & { v: number }>;

    const line = d3
      .line<typeof definedPoints[number]>()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveCatmullRom.alpha(0.1));

    return { points, definedPoints, path: line(definedPoints) || '', xStep, innerW, innerH };
  };

  let content: React.ReactNode;

  if (loading) {
    content = (
      <View style={styles.card}>
        <Placeholder />
      </View>
    );
  } else if (!hasAny) {
    // Soft placeholder chart encouraging first journal
    const dummyValues = [3, 5, 4, 6, 5, 7, 6];
    const { points: dummyPts, path: dummyPath } = buildLine(dummyValues);

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
    const { points, definedPoints, path, xStep } = buildLine(values);

    content = (
      <View style={styles.card}>
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <Svg width={cardWidth} height={chartHeight}>
            {/* Joined line across missing days */}
            <Path d={path} stroke="rgba(172, 166, 255, 0.3)" strokeWidth={4} fill="none" />

            {/* Data points */}
            {definedPoints.map((p, j) => (
              <Circle key={j} cx={p.x} cy={p.y} r={dotRadius} fill="rgba(172, 166, 255, 0.8)" />
            ))}

            {/* X-axis labels, spaced by original index.
               Using padRight ensures the rightmost label isn't clipped. */}
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
        {hasAny && !loading && (
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

const styles = StyleSheet.create({
  container: { marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '600', fontFamily: 'SpaceMono' },
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
    paddingHorizontal: 38,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
});
