import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Image } from 'react-native'
import Constants from 'expo-constants'
import { getAuth } from 'firebase/auth'
import { colors } from '~/constants/Colors'

const API_BASE = Constants.expoConfig?.extra?.backendUrl as string

type Stats = {
  totalWords: number
  totalEntries: number
  currentStreak: number
  avgMoodLast3Days: number | null // NEW: used to pick the face
}

// Face assets (rename if your filenames differ)
const FACE_VERY_SAD        = require('~/assets/images/verysad.png')
const FACE_SAD             = require('~/assets/images/sad.png')
const FACE_NEUTRAL         = require('~/assets/images/mid.png')
const FACE_SLIGHTLY_HAPPY  = require('~/assets/images/happy.png')
const FACE_VERY_HAPPY      = require('~/assets/images/veryhappy.png')

function pickFace(score: number | null | undefined) {
  // fallback to neutral if unknown
  if (score == null || Number.isNaN(score)) return FACE_NEUTRAL
  if (score <= 2) return FACE_VERY_SAD
  if (score <= 4) return FACE_SAD
  if (score <= 6) return FACE_NEUTRAL
  if (score <= 8) return FACE_SLIGHTLY_HAPPY
  return FACE_VERY_HAPPY
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

  // choose face from API number (avgMoodLast3Days)
  const faceSrc = pickFace(stats?.avgMoodLast3Days)

  return (
    <>
      <Text style={styles.sectionTitle}>Habit tracking</Text>

      {/* Top card */}
      <View style={styles.largeCard}>
        <Text style={styles.cardTitle}>Total journaling words</Text>
        <Text style={styles.cardValue}>{stats?.totalWords ?? '–'}</Text>
      </View>

      {/* Row with face + right column */}
      <View style={styles.row}>
        {/* Left face card */}
        <View style={styles.faceCard}>
          <Text style={styles.cardTitle}>Current mood</Text>
          <View style={styles.faceContainer}>
            <Image
              source={faceSrc}
              style={styles.faceImage}
              accessible
              accessibilityLabel="Current mood face"
            />
          </View>
        </View>

        {/* Right column with streak + entries */}
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
    marginBottom: 10,
  },
  largeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
    height: 120,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
    borderColor: colors.lighter,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  faceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: (Dimensions.get('window').width - 40) / 2.5,
    height: 200,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 1,
    borderColor: colors.lighter,
    borderWidth: 1,
  },
  faceContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  rightColumn: {
    flex: 1,
    marginLeft: 8,
    gap: 8,
    justifyContent: 'space-between',
  },
  smallCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 1,
    borderColor: colors.lighter,
    borderWidth: 1,
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
