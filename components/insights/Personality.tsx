import React, { useEffect, useState, JSX, useContext } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { colors } from '~/constants/Colors'
import { Brain, CheckCircle, Heart, AlertCircle, Lightbulb, ShieldCheck, ArrowUp, ArrowDown } from 'lucide-react-native'
import Constants from 'expo-constants'
import { getAuth } from 'firebase/auth'
import { BlurView } from 'expo-blur'
import { useRouter } from 'expo-router'
import { SubscriptionContext } from '~/context/SubscriptionContext'

const API_BASE = Constants.expoConfig?.extra?.backendUrl as string

const PERSONALITY_KEYS = ['resilience','discipline','focus','selfWorth','confidence','clarity'] as const
const ICONS = { resilience: AlertCircle, discipline: CheckCircle, focus: Brain, selfWorth: Heart, confidence: ShieldCheck, clarity: Lightbulb }
const LABELS: Record<string, string> = { resilience: 'Resilience', discipline: 'Discipline', focus: 'Focus', selfWorth: 'Self-Worth', confidence: 'Confidence', clarity: 'Purpose' }

export default function PersonalitySection() {
  const [metrics, setMetrics] = useState<{
    label: string
    value: number
    icon: JSX.Element
    delta: number
    key: string
  }[] | null>(null)
  const { isSubscribed } = useContext(SubscriptionContext)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      const user = getAuth().currentUser
      if (!user) return
      try {
        const token = await user.getIdToken()
        const res = await fetch(`${API_BASE}/api/personality-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const { personalityStats } = await res.json()
        if (!mounted) return
        const formatted = PERSONALITY_KEYS.map((key) => {
          const { value, delta } = personalityStats[key] || { value: 50, delta: 0 }
          const IconComp = ICONS[key]
          return {
            label: LABELS[key],
            value: Math.round(value),
            icon: <IconComp color={colors.blue} size={34} strokeWidth={2} />,
            delta,
            key,
          }
        })
        setMetrics(formatted)
      } catch (err) {
        console.error('Failed to fetch personality metrics:', err)
        if (mounted) setMetrics([])
      }
    }
    fetchData()
    return () => { mounted = false }
  }, [])

  if (metrics === null) {
    return <ActivityIndicator style={{ marginTop: 20 }} size="large" color={colors.blue} />
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Personality</Text>
      <View style={styles.content}>
        <View style={styles.gridStretchContainer}>
          {[0, 2, 4].map((i) => (
            <View key={i} style={styles.row}>
              {[metrics[i], metrics[i + 1]].map(
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

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
    color: '#222',
    marginTop: 10,
    marginBottom: 10,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: colors.lightest,
    paddingTop: 10,
    position: 'relative',
    paddingHorizontal: 2,
    paddingBottom: 10,
    
  },
  gridStretchContainer: {
    width: '100%',
    
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    height: 150,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#222',
    fontFamily: 'SpaceMono',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '600',
    color: '#444',
    fontFamily: 'SpaceMono',
  },
  deltaBadge: {
    backgroundColor: colors.blue,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  deltaText: {
    fontSize: 15,
    color: 'white',
    fontWeight: '600',
    fontFamily: 'SpaceMono',
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarForeground: {
    height: 6,
    backgroundColor: colors.blue,
    borderRadius: 3,
  },
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
})
