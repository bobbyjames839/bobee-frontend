import React, { JSX, useContext, useMemo } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { colors } from '~/constants/Colors'
import { Brain, CheckCircle, Heart, AlertCircle, Lightbulb, ShieldCheck, ArrowUp, ArrowDown } from 'lucide-react-native'
import { BlurView } from 'expo-blur'
import { useRouter } from 'expo-router'
import { SubscriptionContext } from '~/context/SubscriptionContext'

type PersonalityKey = 'resilience' | 'discipline' | 'focus' | 'selfWorth' | 'confidence' | 'clarity'
type PersonalityStats = Record<PersonalityKey, { value: number; delta: number }>

const PERSONALITY_KEYS = ['resilience','discipline','focus','selfWorth','confidence','clarity'] as const
const ICONS = { resilience: AlertCircle, discipline: CheckCircle, focus: Brain, selfWorth: Heart, confidence: ShieldCheck, clarity: Lightbulb }
const LABELS: Record<string, string> = { resilience: 'Resilience', discipline: 'Discipline', focus: 'Focus', selfWorth: 'Self-Worth', confidence: 'Confidence', clarity: 'Purpose' }

type Props = {
  personalityStats: PersonalityStats | null
}

export default function PersonalitySection({ personalityStats }: Props) {
  const { isSubscribed } = useContext(SubscriptionContext)
  const router = useRouter()

  const metrics = useMemo(() => {
    if (!personalityStats) return null
    return PERSONALITY_KEYS.map((key) => {
      const { value = 50, delta = 0 } = personalityStats[key] || { value: 50, delta: 0 }
      const IconComp = ICONS[key]
      return {
        label: LABELS[key],
        value: Math.round(value),
        icon: <IconComp color={colors.blue} size={34} strokeWidth={2} />,
        delta,
        key,
      }
    })
  }, [personalityStats])

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Personality</Text>
      <View style={styles.content}>
        <View style={styles.gridStretchContainer}>
          {[0, 2, 4].map((i) => (
            <View key={i} style={styles.row}>
              {[metrics?.[i], metrics?.[i + 1]].map(
                (m) =>
                  m && (
                    <View key={m.key} style={[styles.card, { width: '48%' }]}>
                      <View style={styles.cardHeader}>
                        {m.icon}
                        <Text style={styles.metricLabel}>{m.label}</Text>
                      </View>
                      <View style={styles.valueRow}>
                        <Text style={styles.metricValue}>{m.value}</Text>
                        {m.delta !== 0 && (
                          <View style={styles.deltaBadge}>
                            {m.delta > 0 ? <ArrowUp size={16} color="white" /> : <ArrowDown size={16} color="white" />}
                            <Text style={styles.deltaText}>{Math.abs(m.delta)}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.progressBarBackground}>
                        <View style={[styles.progressBarForeground, { width: `${m.value}%` }]} />
                      </View>
                    </View>
                  )
              )}
            </View>
          ))}
        </View>

        {!isSubscribed && (
          <BlurView intensity={25} tint="light" style={styles.overlay}>
            <Pressable
              style={styles.subscribeButton}
              onPress={() => router.push('/settings/sub')}
            >
              <Text style={styles.subscribeText}>Subscribe</Text>
            </Pressable>
          </BlurView>
        )}
      </View>
    </View>
  )
}


/* styles left exactly as you had them */
const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
    color: '#222',
    marginTop: 10,
    marginBottom: 3,
  },
  container: { flex: 1 },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.lighter,
    marginTop: 10,
    borderRadius: 16,
    padding: 10,
    position: 'relative',
  },
  gridStretchContainer: { width: '100%', gap: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    flex: 1,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.lighter,
    height: 150,
    justifyContent: 'space-between',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metricLabel: { fontSize: 14, fontWeight: '500', color: '#222', fontFamily: 'SpaceMono' },
  valueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 },
  metricValue: { fontSize: 32, fontWeight: '600', color: '#444', fontFamily: 'SpaceMono' },
  deltaBadge: { backgroundColor: colors.blue, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 3 },
  deltaText: { fontSize: 15, color: 'white', fontWeight: '600', fontFamily: 'SpaceMono' },
  progressBarBackground: { width: '100%', height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden' },
  progressBarForeground: { height: 6, backgroundColor: colors.blue, borderRadius: 3 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 16,
    overflow: 'hidden',
    borderColor: colors.lighter,
    borderWidth: 1,
  },
  subscribeButton: { backgroundColor: colors.blue, paddingHorizontal: 50, paddingVertical: 10, borderRadius: 8 },
  subscribeText: { color: '#fff', fontSize: 16, fontFamily: 'SpaceMono', fontWeight: '600' },
})
