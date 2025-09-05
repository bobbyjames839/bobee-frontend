import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Animated, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { colors } from '~/constants/Colors'
import Svg, { Circle } from 'react-native-svg'
import { MessageCircle } from 'lucide-react-native'

export interface NextMessageCountdownProps {
  lastMessageAt?: number | null
}


export const NextMessageCountdown: React.FC<NextMessageCountdownProps> = ({
  lastMessageAt,
}) => {
  const [now, setNow] = useState(Date.now())
  const intervalRef = useRef<number | null>(null)
  const progressAnim = useRef(new Animated.Value(0)).current
  const router = useRouter()
  const COOLDOWN_MS = 60 * 60 * 1000 * 24

  // compute remaining & progress
  const last = typeof lastMessageAt === 'number' ? lastMessageAt : 0
  const elapsed = now - last
  const remaining = Math.max(COOLDOWN_MS - elapsed, 0)
  const canRequest = remaining === 0
  const progress = Math.min(elapsed / COOLDOWN_MS, 1) // 0..1

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
  const content = canRequest ? 'Ready now' : formatRemaining(remaining)
  const Container: React.ComponentType<any> = canRequest ? Pressable : View

  async function handlePress() {
    if (!canRequest) return
  // Navigate to the bobee personal-message route (single source of truth)
  router.push('/bobee/personal-message')
  }

  // Circular progress metrics
  // Keep image at 50x50; draw ring outside it using the wrapper size
  const SIZE = 84
  const R = 33
  const CIRC = 2 * Math.PI * R
  const dashOffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRC, 0]
  })

  return (
    <View style={styles.containerOuter}>
      <Container
        accessibilityRole={canRequest ? 'button' : undefined}
        onPress={canRequest ? handlePress : undefined}
      >
        <View style={styles.pill}>
          <View style={styles.leftIconWrap}>
            <Svg width={SIZE} height={SIZE}>
              <Circle cx={SIZE/2} cy={SIZE/2} r={R} stroke={colors.lighter} strokeWidth={7} fill="none" />
              <AnimatedCircle cx={SIZE/2} cy={SIZE/2} r={R} stroke={colors.blue} strokeWidth={7} fill="none"
                strokeDasharray={CIRC}
                strokeDashoffset={dashOffset as any}
                strokeLinecap="round"
              />
            </Svg>
            <Image source={require('~/assets/images/happy.png')} style={styles.botIcon} accessibilityLabel="Personal message icon" />
          </View>
          <View style={styles.rightText}>
            <Text style={styles.smallTitle}>Next personal message in</Text>
            <Text style={styles.bigTime}>{content}</Text>
          </View>
          <Pressable
            accessibilityLabel="Open chat"
            onPress={() => router.push('/bobee/chat')}
            style={styles.chatFab}
            hitSlop={8}
          >
            <MessageCircle color="#fff" size={26} strokeWidth={2.5} />
          </Pressable>
        </View>
      </Container>
    </View>
  )
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const styles = StyleSheet.create({
  containerOuter: { marginTop: 10 },
  pill: {
  borderRadius: 18,
  paddingTop: 10,
  paddingBottom: 25,
  paddingHorizontal: 12,
  paddingRight: 56,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: colors.lighter,
  position: 'relative',
  },
  leftIconWrap: { width: 74, height: 74, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  botIcon: { position: 'absolute', width: 50, height: 50, resizeMode: 'contain', borderRadius: 50 },
  rightText: { flex: 1 },
  smallTitle: { color: colors.dark, fontFamily: 'SpaceMono', fontSize: 15, marginBottom: 2 },
  bigTime: { color: colors.darkest, fontFamily: 'SpaceMono', fontSize: 22, fontWeight: '700' },
  chatFab: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 46,
    height: 46,
    borderRadius: 48,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default NextMessageCountdown
