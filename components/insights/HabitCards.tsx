import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native'
import Constants from 'expo-constants'
import { getAuth } from 'firebase/auth'
import { colors } from '~/constants/Colors'

const API_BASE = Constants.expoConfig?.extra?.backendUrl as string

type Stats = {
  totalWords: number
  totalEntries: number
  currentStreak: number
}

export default function HabitCards() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchStats = async () => {
      try {
        const user = getAuth().currentUser
        if (!user) return

        const token = await user.getIdToken()
        const res = await fetch(`${API_BASE}/api/habit-cards-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: Stats = await res.json()
        if (mounted) setStats(data)
      } catch (err) {
        console.error('Failed to fetch HabitCards stats:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchStats()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 20 }} size="large" color={colors.blue} />
  }

  return (
    <>
      <Text style={styles.sectionTitle}>Habit tracking</Text>

      <View style={styles.largeCard}>
        <Text style={styles.cardTitle}>Total journaling words</Text>
        <Text style={styles.cardValue}>{stats?.totalWords ?? '–'}</Text>
      </View>

      <View style={styles.smallCardRow}>
        <View style={styles.smallCard}>
          <Text style={styles.cardTitle}>Current streak</Text>
          <Text style={styles.cardValue}>{stats?.currentStreak ?? '–'}</Text>
        </View>
        <View style={styles.smallCard}>
          <Text style={styles.cardTitle}>Total entries</Text>
          <Text style={styles.cardValue}>{stats?.totalEntries ?? '–'}</Text>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
    color: '#222',
    marginTop: 36,
    marginBottom: 14,
  },
  largeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    height: 200,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  smallCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  smallCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: (Dimensions.get('window').width - 40 - 12) / 2,
    height: 120,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
    fontFamily: 'SpaceMono',
  },
  cardValue: {
    fontSize: 34,
    fontWeight: '600',
    color: colors.blue,
    fontFamily: 'SpaceMono',
    textAlign: 'right',
  },
})
