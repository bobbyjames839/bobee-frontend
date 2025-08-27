import React, { useEffect, useState, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Animated, Easing } from 'react-native'
import { colors } from '~/constants/Colors'
import Header from '~/components/other/Header'
import { Audio, AVPlaybackStatusSuccess } from 'expo-av'
import * as FileSystem from 'expo-file-system'
import { useRouter } from 'expo-router'
import { getAuth } from 'firebase/auth'
import Constants from 'expo-constants'

const API_BASE = Constants.expoConfig?.extra?.backendUrl as string

// Helper: random in [min, max]
const rand = (min: number, max: number) => Math.random() * (max - min) + min

export default function PersonalMessageScreen() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [noRecent, setNoRecent] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [finished, setFinished] = useState(false)
  const [showFinishUI, setShowFinishUI] = useState(false)

  const startedRef = useRef(false)
  const soundRef = useRef<Audio.Sound | null>(null)
  const audioAvailableRef = useRef(false)
  const latestB64Ref = useRef<string | null>(null)
  const router = useRouter()
  // Dummy mode removed – always live

  // === BLOB ANIMATION STATE ===
  const baseR = 90

  // Corner radii (animate individually for irregular shape)
  const rTL = useRef(new Animated.Value(baseR)).current
  const rTR = useRef(new Animated.Value(baseR)).current
  const rBR = useRef(new Animated.Value(baseR)).current
  const rBL = useRef(new Animated.Value(baseR)).current

  // Subtle squash + rotation
  const scaleX = useRef(new Animated.Value(1)).current
  const scaleY = useRef(new Animated.Value(1)).current
  const rotateZ = useRef(new Animated.Value(0)).current

  // Faded background glow (only when speaking)
  const ghostOpacity = useRef(new Animated.Value(0)).current
  const ghostOffsetX = useRef(new Animated.Value(0)).current
  const ghostOffsetY = useRef(new Animated.Value(0)).current
  const ghostScale = useRef(new Animated.Value(1.06)).current

  // Visual phase: 0 = loading/idle, 1 = speaking
  const phase = useRef(new Animated.Value(0)).current
  const bubbleOpacity = useRef(new Animated.Value(1)).current
  const loadingPulse = useRef(new Animated.Value(0)).current
  const finishOpacity = useRef(new Animated.Value(0)).current

  // “Lighten” overlay (white) that makes the bubble look lighter in loading
  const lightenOpacity = phase.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0], // lighter while loading, invisible while speaking
  })

  const blobActiveRef = useRef(false)

  const animateValue = (value: Animated.Value, to: number, duration: number) =>
    Animated.timing(value, { toValue: to, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: false })

  const animateTransformValue = (value: Animated.Value, to: number, duration: number) =>
    Animated.timing(value, { toValue: to, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: false })

  const scheduleMorph = useCallback((mode: 'idle' | 'speaking') => {
    if (!blobActiveRef.current) return

    // subtle ranges + longer timings
  const amp = mode === 'speaking' ? 26 : 14          // stronger wiggle
  const sAmp = mode === 'speaking' ? 0.08 : 0.035    // more squash
  const rotAmp = mode === 'speaking' ? 5 : 2.5       // more rotation
    const dur = mode === 'speaking' ? rand(900, 1400) : rand(1400, 2200)

    const nextRTL = baseR + rand(-amp, amp)
    const nextRTR = baseR + rand(-amp, amp)
    const nextRBR = baseR + rand(-amp, amp)
    const nextRBL = baseR + rand(-amp, amp)

    const nextSX = 1 + rand(-sAmp, sAmp)
    const nextSY = 1 + rand(-sAmp, sAmp)
    const nextRot = rand(-rotAmp, rotAmp)

  const nextGhostOp = mode === 'speaking' ? rand(0.14, 0.22) : 0
  const nextGhostX = mode === 'speaking' ? rand(-6, 6) : 0
  const nextGhostY = mode === 'speaking' ? rand(-6, 6) : 0
  const nextGhostScale = mode === 'speaking' ? rand(1.05, 1.11) : 1.04

    Animated.parallel([
      animateValue(rTL, nextRTL, dur),
      animateValue(rTR, nextRTR, dur),
      animateValue(rBR, nextRBR, dur),
      animateValue(rBL, nextRBL, dur),

      animateTransformValue(scaleX, nextSX, dur),
      animateTransformValue(scaleY, nextSY, dur),
      animateTransformValue(rotateZ, nextRot, dur),

      animateTransformValue(ghostOffsetX, nextGhostX, dur),
      animateTransformValue(ghostOffsetY, nextGhostY, dur),
      animateTransformValue(ghostScale, nextGhostScale, dur),
      animateValue(ghostOpacity, nextGhostOp, dur),

      animateValue(phase, mode === 'speaking' ? 1 : 0, Math.max(320, dur * 0.6)),
    ]).start(({ finished }) => {
      if (finished && blobActiveRef.current) scheduleMorph(mode)
    })
  }, [rTL, rTR, rBR, rBL, scaleX, scaleY, rotateZ, ghostOffsetX, ghostOffsetY, ghostScale, ghostOpacity, phase])

  const startBlob = useCallback((mode: 'idle' | 'speaking') => {
    blobActiveRef.current = true
    // For loading (idle) we swap to a simpler pulse + subtle morph; speaking keeps full morph.
    if (mode === 'idle') {
      // Start pulse loop (scale + opacity shimmer via phase value indirectly)
      loadingPulse.setValue(0)
      Animated.loop(
        Animated.sequence([
          Animated.timing(loadingPulse, { toValue: 1, duration: 900, useNativeDriver: false, easing: Easing.inOut(Easing.quad) }),
          Animated.timing(loadingPulse, { toValue: 0, duration: 900, useNativeDriver: false, easing: Easing.inOut(Easing.quad) })
        ])
      ).start()
      // still do gentle morph (lower amplitude) once to initialize
      scheduleMorph('idle')
    } else {
      scheduleMorph('speaking')
    }
  }, [scheduleMorph])

  const stopBlob = useCallback(() => {
    blobActiveRef.current = false

    rTL.stopAnimation(); rTR.stopAnimation(); rBR.stopAnimation(); rBL.stopAnimation()
    scaleX.stopAnimation(); scaleY.stopAnimation(); rotateZ.stopAnimation()
    ghostOffsetX.stopAnimation(); ghostOffsetY.stopAnimation(); ghostScale.stopAnimation(); ghostOpacity.stopAnimation()
    phase.stopAnimation()

    Animated.parallel([
      animateValue(rTL, baseR, 240),
      animateValue(rTR, baseR, 240),
      animateValue(rBR, baseR, 240),
      animateValue(rBL, baseR, 240),
      animateTransformValue(scaleX, 1, 240),
      animateTransformValue(scaleY, 1, 240),
      animateTransformValue(rotateZ, 0, 240),
      animateTransformValue(ghostOffsetX, 0, 240),
      animateTransformValue(ghostOffsetY, 0, 240),
      animateTransformValue(ghostScale, 1.06, 240),
      animateValue(ghostOpacity, 0, 200),
      animateValue(phase, 0, 200),
    ]).start()
  }, [rTL, rTR, rBR, rBL, scaleX, scaleY, rotateZ, ghostOffsetX, ghostOffsetY, ghostScale, ghostOpacity, phase])

  const unloadSound = useCallback(async () => {
    if (soundRef.current) {
      try { await soundRef.current.unloadAsync() } catch {}
      soundRef.current = null
    }
  }, [])

  const startPlayback = useCallback(async (isReplay: boolean = false) => {
    if (!latestB64Ref.current) return
    setSpeaking(true)
    setFinished(false)
  setShowFinishUI(false)
    try { await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true }) } catch (e) { console.log('[PersonalMessage] Audio mode error', e) }
    try {
      await unloadSound()
      const fileUri = FileSystem.cacheDirectory + 'bobee_message.mp3'
      console.log('[PersonalMessage] Writing audio file, base64 length=', latestB64Ref.current.length)
      await FileSystem.writeAsStringAsync(fileUri, latestB64Ref.current, { encoding: FileSystem.EncodingType.Base64 })
      const { sound } = await Audio.Sound.createAsync({ uri: fileUri }, { shouldPlay: true })
      soundRef.current = sound
      sound.setOnPlaybackStatusUpdate(st => {
        if (!st.isLoaded) return
        const status = st as AVPlaybackStatusSuccess
        if (status.didJustFinish) {
          setSpeaking(false)
          setFinished(true)
        }
      })
      audioAvailableRef.current = true
    } catch (e) {
      console.log('[PersonalMessage] startPlayback error', e)
      setSpeaking(false)
      if (!isReplay) {
        setError('Audio playback failed')
        setFinished(true)
      }
    }
  }, [unloadSound])

  const stopPlayback = useCallback(async () => {
    setSpeaking(false)
    try { await soundRef.current?.stopAsync() } catch {}
  }, [])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        const user = getAuth().currentUser
        if (!user) { setError('Not signed in'); return }
        const token = await user.getIdToken()
        console.log('[PersonalMessage] Fetching bobee-message...')
        const res = await fetch(`${API_BASE}/api/bobee-message`, { 
          method: 'POST', 
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
        console.log('[PersonalMessage] Fetch response status', res.status)
        if (!res.ok) throw new Error('Failed to generate message')
        const data = await res.json()
        console.log('[PersonalMessage] Data received. speech length=', (data.speech||'').length, 'hasAudio=', !!data.audio)
        if (!mounted) return
        const speech = data.speech || 'No message generated.'
        setMessage(speech)
        setNoRecent(!!data.noRecentJournals)
        if (data.audio && data.audio.b64) {
          latestB64Ref.current = data.audio.b64
          if (!startedRef.current) { startedRef.current = true; startPlayback(false) }
        } else {
          audioAvailableRef.current = false
          setError('Audio unavailable')
          setFinished(true)
        }
      } catch (e: any) {
        console.log('[PersonalMessage] Error fetching / generating', e)
        if (!mounted) return
        setError(e.message || 'Failed')
      } finally {
        console.log('[PersonalMessage] Initial fetch complete, mounted=', mounted)
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false; stopPlayback(); unloadSound(); stopBlob() }
  }, [])

  // Manage blob lifecycle (non-dummy)
  useEffect(() => {
    if (loading) { startBlob('idle'); return }
    if (speaking) { startBlob('speaking'); return }
    if (finished) {
      Animated.parallel([
        Animated.timing(bubbleOpacity, { toValue: 0, duration: 600, useNativeDriver: false, easing: Easing.out(Easing.quad) }),
        Animated.timing(ghostOpacity, { toValue: 0, duration: 600, useNativeDriver: false })
      ]).start(() => {
        stopBlob()
        setShowFinishUI(true)
      })
      return
    }
  }, [loading, speaking, finished, startBlob, stopBlob])

  const onRefresh = async () => {
    setRefreshing(true)
    setError(null)
    try {
      const user = getAuth().currentUser
      if (!user) { setError('Not signed in'); return }
      const token = await user.getIdToken()
      console.log('[PersonalMessage] Refresh: fetching bobee-message...')
      const res = await fetch(`${API_BASE}/api/bobee-message`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
      console.log('[PersonalMessage] Refresh response status', res.status)
      if (!res.ok) throw new Error('Failed to generate message')
      const data = await res.json()
      console.log('[PersonalMessage] Refresh data received, speech length=', (data.speech||'').length, 'hasAudio=', !!data.audio)
      const speech = data.speech || 'No message generated.'
      setMessage(speech)
      setNoRecent(!!data.noRecentJournals)
      if (data.audio && data.audio.b64) {
        latestB64Ref.current = data.audio.b64
        startedRef.current = true
        startPlayback(true)
      } else {
        setError('Audio unavailable')
        setFinished(true)
      }
    } catch (e: any) {
      console.log('[PersonalMessage] Refresh error', e)
      setError(e.message || 'Failed')
    } finally {
      setRefreshing(false)
    }
  }

  const rotateStr = rotateZ.interpolate({ inputRange: [-180, 180], outputRange: ['-180deg', '180deg'] })

  // Safety: ensure finish UI eventually shows (in case animations are interrupted)
  useEffect(() => {
    if (!finished) return
    if (showFinishUI) return
    const safety = setTimeout(() => {
      if (!showFinishUI) {
        stopBlob()
        setShowFinishUI(true)
      }
    }, 2500)
    return () => clearTimeout(safety)
  }, [finished, showFinishUI, stopBlob])

  // Fade in finish UI when it mounts
  useEffect(() => {
    if (showFinishUI) {
      finishOpacity.setValue(0)
      Animated.timing(finishOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: false }).start()
    }
  }, [showFinishUI, finishOpacity])

  return (
    <>
      <Header title='Personal message' />
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {error && <Text style={[styles.meta, styles.error]}>{error}</Text>}
  <View style={styles.centerOuter}>
          {!showFinishUI && (
            <>
              {/* Faded background glow (speaking only) */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.bubbleGlow,
                  {
                    opacity: ghostOpacity,
                    transform: [
                      { translateX: ghostOffsetX },
                      { translateY: ghostOffsetY },
                      { scale: ghostScale },
                      { rotate: rotateStr },
                    ],
                    borderTopLeftRadius: rTL,
                    borderTopRightRadius: rTR,
                    borderBottomRightRadius: rBR,
                    borderBottomLeftRadius: rBL,
                  },
                ]}
              />
              {/* Main bubble (no text) */}
              <Animated.View
                style={[
                  styles.bubble,
                  {
                    transform: [{ scaleX }, { scaleY }, { rotate: rotateStr }],
                    borderTopLeftRadius: rTL,
                    borderTopRightRadius: rTR,
                    borderBottomRightRadius: rBR,
                    borderBottomLeftRadius: rBL,
                    opacity: bubbleOpacity,
                    ...(loading ? { transform: [{ scale: loadingPulse.interpolate({ inputRange: [0,1], outputRange: [0.9, 1.12] }) }] } : {}),
                  },
                ]}
              >
                {/* lighten overlay makes loading look like a lighter blue */}
                <Animated.View style={[styles.lighten, { opacity: lightenOpacity }]} />
              </Animated.View>
            </>
          )}
          {showFinishUI && (
            <Animated.View style={[styles.finishSectionCentered, { opacity: finishOpacity }]}>
              <Text style={styles.finishHeading}>Reflection complete</Text>
              <Text style={styles.finishNote}>Come back tomorrow for a fresh personal reflection.</Text>
              <Pressable style={styles.finishBtn} onPress={() => { router.replace('/(tabs)/insights'); }}>
                <Text style={styles.finishBtnText}>Back to insights</Text>
              </Pressable>
            </Animated.View>
          )}
          {!finished && !error && !speaking && !loading && (
            <Text style={styles.meta}>Waiting to start...</Text>
          )}
        </View>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.lightest, flexGrow: 1 },
  centerOuter: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, width: '100%', position: 'relative', paddingBottom: 80 },

  // Main bubble: dark blue; appears lighter during loading via the white overlay below
  bubble: {
    width: 200, height: 200,
    backgroundColor: colors.blue,
    overflow: 'hidden',
    opacity: 0.95,
  },

  // Subtle faded aura while speaking (no “border” look, no shadow)
  bubbleGlow: {
    width: 240, height: 240,
    backgroundColor: 'rgba(0,0,80,0.07)', // subtle faded background dedicated to bubble
    position: 'absolute',
    shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 12 }, shadowRadius: 28,
  },

  // White overlay to visually lighten the bubble during loading
  lighten: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFFFFF',
  },

  primaryBtn: { marginTop: 24, backgroundColor: colors.blue, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontFamily: 'SpaceMono', fontSize: 16, fontWeight: '600' },
  finishBtn: { marginTop: 40, backgroundColor: colors.blue, paddingVertical: 18, paddingHorizontal: 42, borderRadius: 50, alignItems: 'center', shadowColor: colors.blue, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 8 }, shadowRadius: 24 },
  finishBtnText: { color: '#fff', fontFamily: 'SpaceMono', fontSize: 18, fontWeight: '600', letterSpacing: 0.8 },
  finishSection: { marginTop: 34, alignItems: 'center', paddingHorizontal: 16 },
  finishSectionCentered: { position: 'absolute', top: '50%', left: '50%', width: 300, marginLeft: -150, marginTop: -120, alignItems: 'center', paddingHorizontal: 16 },
  finishHeading: { fontSize: 22, fontWeight: '600', color: colors.dark, fontFamily: 'SpaceMono', marginBottom: 10 },
  finishNote: { fontSize: 13, color: colors.dark, opacity: 0.75, fontFamily: 'SpaceMono', textAlign: 'center', lineHeight: 18, maxWidth: 260 },

  meta: { fontSize: 14, color: colors.dark, fontFamily: 'SpaceMono', marginBottom: 12 },
  error: { color: 'crimson' },
  note: { marginTop: 14, fontSize: 12, color: colors.dark, opacity: 0.7, fontFamily: 'SpaceMono' }
})
