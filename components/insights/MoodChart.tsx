import React, { useState, useEffect } from 'react'
import { View, Text, Dimensions, StyleSheet } from 'react-native'
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg'
import * as d3 from 'd3-shape'
import Constants from 'expo-constants'
import { getAuth } from 'firebase/auth'
import AnimatedToggle from './AnimatedToggle'
import Placeholder from './Placeholder'

type RangeKey = '7d' | '28d'
interface MoodSeries { labels: string[]; values: Array<number|null> }
type SeriesResponse = Record<RangeKey, MoodSeries>

export default function MoodChart() {
  const [range, setRange] = useState<RangeKey>('7d')
  const [series, setSeries] = useState<SeriesResponse>({
    '7d': { labels: [], values: [] },
    '28d': { labels: [], values: [] },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetchSeries = async () => {
      try {
        const user = getAuth().currentUser
        if (!user) return
        const token = await user.getIdToken()
        const res = await fetch(
          `${Constants.expoConfig?.extra?.backendUrl}/api/mood-chart-stats`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: SeriesResponse = await res.json()
        if (mounted) setSeries(data)
      } catch (err) {
        console.error('Failed to fetch mood series:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchSeries()
    return () => { mounted = false }
  }, [])

  const { labels, values } = series[range]
  const hasAny = values.some(v => v != null)
  if (loading || !hasAny) return <Placeholder />

  const cardWidth = Dimensions.get('window').width - 60
  const padding = 12
  const dotRadius = 5
  const chartHeight = 260

  const xStep = (cardWidth - 2 * padding - 2 * dotRadius) / (values.length - 1)
  const nums = values.filter((v): v is number => v != null)
  const minY = Math.min(...nums)
  const maxY = Math.max(...nums)
  const yRange = maxY - minY || 1

  const points = values.map((v, i) => ({
    x: dotRadius + i * xStep,
    y: v != null
      ? padding + (1 - (v - minY) / yRange) * (chartHeight - 2 * padding)
      : 0,
    defined: v != null,
  }))

  const linePath = d3.line<typeof points[0]>()
    .x(d => d.x).y(d => d.y)
    .curve(d3.curveCatmullRom.alpha(0.1))(points.filter(p => p.defined)) || ''

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mood over time</Text>
        <View style={styles.toggleRow}>
          <AnimatedToggle label="1W" active={range==='7d'} onPress={()=>setRange('7d')} />
          <AnimatedToggle label="4W" active={range==='28d'} onPress={()=>setRange('28d')} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <Svg width={cardWidth - 2 * padding} height={chartHeight + 24}>
            <Path d={linePath} stroke="rgba(172, 166, 255, 0.3)" strokeWidth={4} fill="none" />
            {points.map((p, i) =>
              p.defined ? (
                <Circle key={i} cx={p.x} cy={p.y} r={dotRadius} fill="rgba(172, 166, 255, 0.8)" />
              ) : null
            )}
            {labels.map((lab, i) => (
              <SvgText
                key={i}
                x={dotRadius + i * xStep}
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: { 
    marginTop: 16 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  title: { 
    fontSize: 22, 
    fontWeight: '600', 
    fontFamily: 'SpaceMono' 
  },
  toggleRow: { 
    flexDirection: 'row' 
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
    overflow: 'visible',
  },
})
