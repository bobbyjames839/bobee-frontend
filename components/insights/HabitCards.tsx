import React from 'react'
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native'
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg'
import { colors } from '~/constants/Colors'

// define the type locally to avoid circular imports
type Stats = {
  totalWords: number
  totalEntries: number
  currentStreak: number
  avgMoodLast3Days: number | null
  hourlyHistogram?: number[] // length 24, counts by UTC hour
}

const FACE_VERY_SAD        = require('~/assets/images/verysad.png')
const FACE_SAD             = require('~/assets/images/sad.png')
const FACE_NEUTRAL         = require('~/assets/images/mid.png')
const FACE_SLIGHTLY_HAPPY  = require('~/assets/images/happy.png')
const FACE_VERY_HAPPY      = require('~/assets/images/veryhappy.png')

function pickFace(score: number | null | undefined) {
  if (score == null || Number.isNaN(score)) return FACE_NEUTRAL
  if (score <= 2) return FACE_VERY_SAD
  if (score <= 4) return FACE_SAD
  if (score <= 6) return FACE_NEUTRAL
  if (score <= 8) return FACE_SLIGHTLY_HAPPY
  return FACE_VERY_HAPPY
}

type Props = {
  stats: Stats | null
}

export default function HabitCards({ stats }: Props) {

  const faceSrc = pickFace(stats?.avgMoodLast3Days)

  // Build bar chart data
  const histogram = stats?.hourlyHistogram && stats.hourlyHistogram.length === 24 ? stats.hourlyHistogram : null
  const maxCount = histogram ? Math.max(1, ...histogram) : 1
  const hourLabels = ['0','3','6','9','12','15','18','21']

  // helper: Catmull–Rom to Bézier path
  // helper: Catmull–Rom to Bézier path
  function smoothPathFrom(points: { x: number; y: number; c: number }[], baselineY: number, tension = 1.2) {
    if (points.length === 0) return ''
    if (points.length === 1) return `M${points[0].x},${points[0].y}`

    const path: string[] = [`M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`]

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[i + 2] ?? p2

      const bothBaseline = p1.y === baselineY && p2.y === baselineY

      if (bothBaseline) {
        // straight line along the baseline
        path.push(`L${p2.x.toFixed(2)},${p2.y.toFixed(2)}`)
      } else {
        // smooth curve
        const c1x = p1.x + (p2.x - p0.x) / 6 * tension
        const c1y = p1.y + (p2.y - p0.y) / 6 * tension
        const c2x = p2.x - (p3.x - p1.x) / 6 * tension
        const c2y = p2.y - (p3.y - p1.y) / 6 * tension

        path.push(
          `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
        )
      }
    }

    return path.join(' ')
  }


  // Line + area chart geometry
  const chartHeight = 120
  const chartPadTop = 8
  const chartPadBottom = 24
  const chartPadLeft = 6
  const chartPadRight = 6
  const innerH = chartHeight - chartPadTop - chartPadBottom
  const cardInnerWidth =
    Dimensions.get('window').width - 40 - 32 // page padding (20) + card horizontal padding (16) *2 approximated
  const usableWidth = cardInnerWidth - chartPadLeft - chartPadRight

  const points = histogram
    ? histogram.map((c, i) => {
        const x = chartPadLeft + (usableWidth * (i / 23))
        const norm = c / maxCount
        const y = chartPadTop + (1 - norm) * innerH
        return { x, y, c, i }
      })
    : []

  const baselineY = chartPadTop + innerH
  const lineD = points.length ? smoothPathFrom(points, baselineY, 1.2) : ''
  const areaD = lineD
    ? `${lineD} L${points[points.length - 1].x.toFixed(2)},${baselineY.toFixed(2)} L${points[0].x.toFixed(2)},${baselineY.toFixed(2)} Z`
    : ''



  return (
    <>
      <Text style={styles.sectionTitle}>Habit tracking</Text>

      <View style={styles.largeCard}>
        <Text style={styles.cardTitle}>Total journaling words</Text>
        <Text style={styles.cardValue}>{stats?.totalWords ?? '–'}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.faceCard}>
          <Text style={styles.cardTitle}>Current mood</Text>
          <View style={styles.faceContainer}>
            <Image source={faceSrc} style={styles.faceImage} accessible accessibilityLabel="Current mood face" />
          </View>
        </View>

        <View style={styles.rightColumn}>
          <View style={styles.smallCard}>
            <Text style={styles.cardTitle}>Current streak</Text>
            <Text style={styles.cardValue}>{stats?.currentStreak ?? '–'}</Text>
          </View>
          <View style={styles.smallCard}>
            <Text style={styles.cardTitle}>Total entries</Text>
            <Text style={styles.cardValue}>{stats?.totalEntries ?? '–'}</Text>
          </View>
        </View>
      </View>

      {histogram && (
        <View style={[styles.largeCard, styles.largeCardBottom]}>
          <Text style={styles.cardTitle}>Journals by hour</Text>
          <View style={{ height: chartHeight }}>
            <Svg width={'100%'} height={chartHeight}>
              {/* Area fill */}
              <Path d={areaD} fill="rgba(101,122,241,0.18)" />
              {/* Line */}
              <Path d={lineD} stroke={colors.blue} strokeWidth={2} fill="none" />
              {/* Points */}
              {points.map(p => (
                p.c > 0 ? <Circle key={p.i} cx={p.x} cy={p.y} r={3} fill={colors.blue} /> : null
              ))}
              {/* X axis labels every 3 hours */}
              {points.filter(p => hourLabels.includes(String(p.i))).map(p => (
                <SvgText key={p.i} x={p.x} y={chartHeight - 6} fontSize={10} fill="#555" textAnchor="middle" fontFamily="SpaceMono">{p.i}</SvgText>
              ))}
            </Svg>
          </View>
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 22, fontWeight: '600', fontFamily: 'SpaceMono', color: '#222', marginTop: 34, marginBottom: 10 },
  largeCard: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 8, minHeight: 120, justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 2, borderColor: colors.lighter, borderWidth: 1 },
  largeCardBottom: { marginBottom: 24 },  
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  faceCard: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, width: (Dimensions.get('window').width - 40) / 2.5, height: 200, justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 1, borderColor: colors.lighter, borderWidth: 1 },
  faceContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  faceImage: { width: 100, height: 100, resizeMode: 'contain' },
  rightColumn: { flex: 1, marginLeft: 8, gap: 8, justifyContent: 'space-between' },
  smallCard: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, flex: 1, justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 1, borderColor: colors.lighter, borderWidth: 1 },
  cardTitle: { fontSize: 16, fontWeight: '500', color: '#222', fontFamily: 'SpaceMono' },
  cardValue: { fontSize: 34, fontWeight: '600', color: colors.blue, fontFamily: 'SpaceMono', textAlign: 'right' },
  barChartRow: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 2, marginTop: 6 },
  barWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '70%', backgroundColor: colors.blue, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barLabel: { fontSize: 10, color: '#555', marginTop: 2, fontFamily: 'SpaceMono' },
})
