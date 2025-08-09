import React, { useState, useEffect, useContext } from 'react'
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native'
import { BlurView } from 'expo-blur'
import Placeholder from './Placeholder'
import { useRouter } from 'expo-router'
import Constants from 'expo-constants'
import { colors } from '~/constants/Colors'
import { SubscriptionContext } from '~/context/SubscriptionContext'
import { getAuth } from 'firebase/auth'

const API_BASE = Constants.expoConfig?.extra?.backendUrl as string

export default function TopicsSection() {
  const [topicsList, setTopicsList] = useState<
    Array<{ topic: string; count: number }>
  >([])

  const { isSubscribed } = useContext(SubscriptionContext)
  const router = useRouter()

  const PARENT_HORIZONTAL_PADDING = 40
  const CARD_HORIZONTAL_PADDING = 24
  const windowWidth = Dimensions.get('window').width
  const cardInnerWidth = windowWidth - PARENT_HORIZONTAL_PADDING - CARD_HORIZONTAL_PADDING

  useEffect(() => {
    let mounted = true

    const fetchTopics = async () => {
      try {
        const user = getAuth().currentUser
        if (!user) return

        const token = await user.getIdToken()
        const res = await fetch(`${API_BASE}/api/topics`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const { topics } = await res.json()
        if (mounted) setTopicsList(topics)
      } catch (err) {
        console.error('Error fetching topics:', err)
      }
    }

    fetchTopics()
    return () => { mounted = false }
  }, [])

  if (topicsList.length === 0) {
    return (
      <>
        <Text style={styles.sectionTitle}>Common topics</Text>
        <Placeholder />
      </>
    )
  }

  const maxCount = topicsList[0].count
  const totalItems = topicsList.length

  return (
    <>
      <Text style={styles.sectionTitle}>Common topics</Text>
      <View style={styles.card}>
        {topicsList.map((t, index) => {
          const fraction = t.count / maxCount
          let barWidth = fraction * cardInnerWidth

          const MIN_WIDTH = 60
          if (barWidth < MIN_WIDTH) barWidth = MIN_WIDTH
          if (barWidth > cardInnerWidth) barWidth = cardInnerWidth

          const lightness = 40 + (index / totalItems) * 35
          const barColor = `hsl(220, 90%, ${lightness}%)`

          return (
            <View key={t.topic} style={styles.barRow}>
              <View
                style={[
                  styles.topicBar,
                  { width: barWidth, backgroundColor: barColor },
                ]}
              >
                <Text
                  style={styles.topicText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {t.topic}
                </Text>
              </View>
            </View>
          )
        })}

        {!isSubscribed && (
          <BlurView intensity={12} tint="light" style={styles.overlay}>
            <Pressable
              style={styles.subscribeButton}
              onPress={() => router.push('/settings/sub')}
            >
              <Text style={styles.subscribeText}>Subscribe</Text>
            </Pressable>
          </BlurView>
        )}
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
    marginTop: 26,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  barRow: {
    marginBottom: 8,
  },
  topicBar: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  topicText: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
    color: '#fff',
    flexShrink: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'white',
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
