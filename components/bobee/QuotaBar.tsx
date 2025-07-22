// src/components/QuotaBar.tsx
import React, { useContext, useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { SubscriptionContext } from '~/context/SubscriptionContext'
import { getAuth } from 'firebase/auth'
import { colors } from '~/constants/Colors'

const API_BASE = Constants.expoConfig?.extra?.backendUrl as string

export default function QuotaBar() {
  const { isSubscribed } = useContext(SubscriptionContext)
  const [count, setCount] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const fetchTodayCount = async () => {
      try {
        const user = getAuth().currentUser
        if (!user) return

        const token = await user.getIdToken()
        const res = await fetch(`${API_BASE}/api/metrics`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const { todayCount } = await res.json()
        if (mounted) setCount(todayCount)
      } catch (err) {
        console.warn('QuotaBar fetch error:', err)
        if (mounted) setCount(0)
      }
    }

    fetchTodayCount()

    // Optionally: refresh every minute
    const interval = setInterval(fetchTodayCount, 60_000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [isSubscribed])

  const limit = isSubscribed ? 50 : 5
  const displayCount = count ?? 0
  const pct = Math.min((displayCount / limit) * 100, 100)

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {count === null ? (
          <ActivityIndicator size="small" color={colors.dark} />
        ) : (
          <Text style={styles.text}>
            Conversations today: {displayCount} / {limit}
          </Text>
        )}
        {!isSubscribed && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push('/settings/sub')}
          >
            <Text style={styles.upgradeText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 20,
    borderRadius: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
    color: '#333',
  },
  barBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.blue,
  },
  upgradeButton: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    backgroundColor: colors.green,
    borderRadius: 6,
  },
  upgradeText: {
    color: colors.dark,
    fontSize: 12,
    fontFamily: 'SpaceMono',
  },
})
