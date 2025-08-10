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
interface MoodSeries { labels: string[]; values: Array<number|null> }
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
  const padding = 12;
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

  const { labels, values } = series[range];
  const hasAny = values.some(v => v != null);

  const buildLine = (ys: number[]) => {
    const localXStep = ys.length > 1
      ? (cardWidth - 2 * padding - 2 * dotRadius) / (ys.length - 1)
      : 0;
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const yRange = maxY - minY || 1;

    const pts = ys.map((v, i) => ({
      x: dotRadius + i * localXStep,
      y: padding + (1 - (v - minY) / yRange) * (chartHeight - 2 * padding),
    }));

    const path = d3.line<typeof pts[0]>()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveCatmullRom.alpha(0.1))(pts) || '';

    return { pts, path, xStep: localXStep };
  };

  let content: React.ReactNode;

  if (loading) {
    content = (
      <View style={styles.card}>
        <Placeholder />
      </View>
    );
  } else if (!hasAny) {
    const dummyValues = [3, 5, 4, 6, 5, 7, 6];
    const { pts: dummyPts, path: dummyPath } = buildLine(dummyValues);

    content = (
      <View style={[styles.card, styles.fixedChartHeight]}>
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <Svg width={cardWidth - 2 * padding} height={chartHeight + 24}>
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
    const defined = values.filter((v): v is number => v != null);
    const { pts, path, xStep } = buildLine(defined);

    content = (
      <View style={styles.card}>
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <Svg width={cardWidth - 2 * padding} height={chartHeight + 24}>
            <Path d={path} stroke="rgba(172, 166, 255, 0.3)" strokeWidth={4} fill="none" />
            {defined.map((_, j) => (
              <Circle
                key={j}
                cx={dotRadius + j * xStep}
                cy={pts[j].y}
                r={dotRadius}
                fill="rgba(172, 166, 255, 0.8)"
              />
            ))}
            {labels.map((lab, i) => (
              <SvgText
                key={i}
                x={dotRadius + i * (values.length > 1
                  ? (cardWidth - 2 * padding - 2 * dotRadius) / (values.length - 1)
                  : 0)}
                y={chartHeight + 14}
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
            <AnimatedToggle label="1W" active={range==='7d'} onPress={()=>setRange('7d')} />
            <AnimatedToggle label="4W" active={range==='28d'} onPress={()=>setRange('28d')} />
          </View>
        )}
      </View>

      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '600', fontFamily: 'SpaceMono', marginBottom: 10 },
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
