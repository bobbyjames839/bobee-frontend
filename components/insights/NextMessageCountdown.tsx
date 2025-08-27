import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Animated, Modal, TouchableOpacity, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { getAuth } from 'firebase/auth'
import Constants from 'expo-constants'
import { colors } from '~/constants/Colors'

export interface NextMessageCountdownProps {
  lastMessageAt?: number | null
  cooldownMs?: number
}

const DEFAULT_COOLDOWN = 60 * 1000 

export const NextMessageCountdown: React.FC<NextMessageCountdownProps> = ({
  lastMessageAt,
  cooldownMs = DEFAULT_COOLDOWN
}) => {
  const [now, setNow] = useState(Date.now())
  const intervalRef = useRef<number | null>(null)
  const progressAnim = useRef(new Animated.Value(0)).current
  const [infoVisible, setInfoVisible] = useState(false)
  const router = useRouter()
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string

  // compute remaining & progress
  const last = typeof lastMessageAt === 'number' ? lastMessageAt : 0
  const elapsed = now - last
  const remaining = Math.max(cooldownMs - elapsed, 0)
  const canRequest = remaining === 0
  const progress = Math.min(elapsed / cooldownMs, 1) // 0..1

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000) as unknown as number
        return () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
        }
  }, [])

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false
    }).start()
  }, [progress])

  function formatRemaining(ms: number) {
    const totalSec = Math.floor(ms / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  })
  const barComputedWidth: any = progress >= 0.999 ? '100%' : barWidth
  const content = canRequest ? 'Your message is ready' : `Ready in ${formatRemaining(remaining)}`
  const Container: React.ComponentType<any> = canRequest ? Pressable : View

  async function handlePress() {
    if (!canRequest) return
    router.push('/insights/personal-message')
  }

  return (
    <View style={styles.containerOuter}>
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>Personal message</Text>
        <TouchableOpacity accessibilityLabel="What is this?" onPress={() => setInfoVisible(true)} style={styles.infoBadge}>
          <Text style={styles.infoText}>i</Text>
        </TouchableOpacity>
      </View>
      <Container
        accessibilityRole={canRequest ? 'button' : undefined}
        onPress={canRequest ? handlePress : undefined}
        style={styles.card}
      >
        <View style={styles.cardRow}>
          <Image source={require('~/assets/images/happy.png')} style={styles.cardIcon} accessibilityLabel="Personal message icon" />
          <View style={styles.cardContent}>
            <Text style={styles.statusText}>{content}</Text>
            <View style={styles.barTrack}>
              <Animated.View style={[styles.barFill, { width: barComputedWidth }]} />
            </View>
            {canRequest && <Text style={styles.tapHint}>Tap to open</Text>}
          </View>
        </View>
      </Container>
      <Modal
        visible={infoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Personal message</Text>
            <Text style={styles.modalBody}>
              Every 24 hours you can request a personalised reflection summarising key themes and gentle encouragement based on your recent journaling. This countdown shows when the next one is available.
            </Text>
            <Pressable style={styles.closeButton} onPress={() => setInfoVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  containerOuter: { marginTop: 30 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 22, fontWeight: '600', fontFamily: 'SpaceMono', color: '#222', marginBottom: 10, marginTop: 0 },
  infoBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.lighter, alignItems: 'center', justifyContent: 'center', marginBottom: 10, marginLeft: 8 },
  infoText: { color: colors.dark, fontWeight: '600', fontSize: 13, fontFamily: 'SpaceMono' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
  paddingRight: 18,
  paddingLeft: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.lighter,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { width: 52, height: 52, resizeMode: 'contain', marginRight: 10 },
  cardContent: { flex: 1 },
  statusText: { fontSize: 16, fontWeight: '500', color: colors.dark, fontFamily: 'SpaceMono' },
  barTrack: { height: 10, backgroundColor: colors.lightest, borderRadius: 8, overflow: 'hidden', marginTop: 10 },
  barFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.blue, borderRadius: 8 },
  tapHint: { marginTop: 10, fontSize: 12, textAlign: 'left', color: colors.blue, fontFamily: 'SpaceMono', opacity: 0.9 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  modalCard: { backgroundColor: '#fff', borderRadius: 18, padding: 20, width: '100%', borderWidth: 1, borderColor: colors.lighter, shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4 },
  modalTitle: { fontSize: 20, fontWeight: '600', fontFamily: 'SpaceMono', color: '#111', marginBottom: 10 },
  modalBody: { fontSize: 14, lineHeight: 20, color: '#333', fontFamily: 'SpaceMono', marginBottom: 16 },
  closeButton: { backgroundColor: colors.blue, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', fontFamily: 'SpaceMono' }
})

export default NextMessageCountdown
