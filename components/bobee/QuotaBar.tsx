import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { colors } from '~/constants/Colors'

type Props = {
  todayCount: number
  isSubscribed: boolean
}

export default function QuotaBar({ todayCount, isSubscribed }: Props) {
  const router = useRouter()
  const limit = isSubscribed ? 50 : 5
  const pct = Math.min((todayCount / limit) * 100, 100)

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.text}>
          Conversations today: {todayCount} / {limit}
        </Text>
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    marginBottom: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.lighter
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    paddingVertical: 8,
    backgroundColor: colors.green,
    borderWidth: 1,
    borderColor: 'rgba(16, 184, 30, 1)',
    borderRadius: 6,
  },
  upgradeText: {
    color: colors.dark,
    fontSize: 12,
    fontFamily: 'SpaceMono',
  },
})
