import React, { useEffect, useState, useCallback } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { useJournalRefresh } from '~/context/JournalRefreshContext'
import HabitCards from '~/components/insights/HabitCards'
import NextMessageCountdown from '~/components/insights/NextMessageCountdown'
import MoodChart from '~/components/insights/MoodChart'
import TopicsSection from '~/components/insights/TopicsSection'
import PersonalitySection from '~/components/insights/Personality'
import Header from '~/components/other/Header'
import { colors } from '~/constants/Colors'
import SpinningLoader from '~/components/other/SpinningLoader'

import Constants from 'expo-constants'
import { useFocusEffect } from '@react-navigation/native'
import { getAuth } from 'firebase/auth'

const API_BASE = Constants.expoConfig?.extra?.backendUrl as string

// types kept local (single source of truth)
type Stats = {
  totalWords: number
  totalEntries: number
  currentStreak: number
  avgMoodLast3Days: number | null
  hourlyHistogram?: number[]
}

type RangeKey = '7d' | '28d'
interface MoodSeries { labels: string[]; values: Array<number | null> }
type SeriesResponse = Record<RangeKey, MoodSeries>

type PersonalityKey = 'resilience' | 'discipline' | 'focus' | 'selfWorth' | 'confidence' | 'clarity'
type PersonalityStats = Record<PersonalityKey, { value: number; delta: number }>

type Topic = { topic: string; count: number }

export default function InsightsPage() {
  const { refreshKey } = useJournalRefresh()

  // single page-level loader
  const [loading, setLoading] = useState(true)

  // data
  const [stats, setStats] = useState<Stats | null>(null)
  const [moodSeries, setMoodSeries] = useState<SeriesResponse>({
    '7d': { labels: [], values: [] },
    '28d': { labels: [], values: [] },
  })
  const [personality, setPersonality] = useState<PersonalityStats | null>(null)
  const [topics, setTopics] = useState<Topic[] | null>(null)
  // personal message cooldown tracking (frontend only for now)
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null)
  // Personal message cooldown: 24 hours
  // const COOLDOWN_MS = 24 * 60 * 60 * 1000
  const COOLDOWN_MS = 10

  useEffect(() => {
    let mounted = true

    const fetchAll = async () => {
      try {
        const user = getAuth().currentUser
        if (!user) {
          if (!mounted) return
          setStats(null)
          setMoodSeries({ '7d': { labels: [], values: [] }, '28d': { labels: [], values: [] } })
          setPersonality(null)
          setTopics([])
          return
        }

        const token = await user.getIdToken()

        const [statsRes, moodRes, personalityRes, topicsRes, lastMsgRes] = await Promise.all([
          fetch(`${API_BASE}/api/habit-cards-stats`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/mood-chart-stats`,  { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/personality-stats`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/topics`,           { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/bobee-message-meta`, { headers: { Authorization: `Bearer ${token}` } }),
        ])

        if (!statsRes.ok) throw new Error(`HabitCards HTTP ${statsRes.status}`)
        if (!moodRes.ok)  throw new Error(`MoodChart HTTP ${moodRes.status}`)
        if (!personalityRes.ok) throw new Error(`Personality HTTP ${personalityRes.status}`)
        if (!topicsRes.ok) throw new Error(`Topics HTTP ${topicsRes.status}`)
        if (!lastMsgRes.ok) throw new Error(`BobeeMessageMeta HTTP ${lastMsgRes.status}`)

        const statsData = (await statsRes.json()) as Stats
        const moodData = (await moodRes.json()) as SeriesResponse
        const personalityData = (await personalityRes.json()) as { personalityStats: PersonalityStats }
        const topicsData = (await topicsRes.json()) as { topics: Topic[] }
        const lastMsgData = (await lastMsgRes.json()) as { lastBobeeMessage: number | null }

        if (!mounted) return
        setStats(statsData)
        setMoodSeries(moodData)
        setPersonality(personalityData.personalityStats)
        setTopics(topicsData.topics ?? [])
        setLastMessageAt(lastMsgData.lastBobeeMessage ?? null)
      } catch (e) {
        console.error('Failed fetching insights:', e)
        if (!mounted) return
        // safe fallbacks
        setTopics([])
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    fetchAll()
    return () => { mounted = false }
  }, [refreshKey])

  // Refresh bobee message meta each time screen gains focus (captures timestamp reset after viewing message)
  useFocusEffect(
    useCallback(() => {
      let active = true
      const refetchMeta = async () => {
        try {
          const user = getAuth().currentUser
          if (!user) return
          const token = await user.getIdToken()
          const res = await fetch(`${API_BASE}/api/bobee-message-meta`, { headers: { Authorization: `Bearer ${token}` } })
          if (!res.ok) return
          const data = await res.json() as { lastBobeeMessage: number | null }
          if (!active) return
          setLastMessageAt(data.lastBobeeMessage ?? null)
        } catch (_) { /* silent */ }
      }
      refetchMeta()
      return () => { active = false }
    }, [])
  )

  return (
    <>
      <Header title='Insights'/>
      <View key={refreshKey} style={styles.mainContainer}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <SpinningLoader size={40} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <NextMessageCountdown
              lastMessageAt={lastMessageAt}
              cooldownMs={COOLDOWN_MS}
            />
            <HabitCards stats={stats} />
            <MoodChart series={moodSeries} />
            <TopicsSection topics={topics} />
            <PersonalitySection personalityStats={personality} />
          </ScrollView>
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: colors.lightest },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
})
