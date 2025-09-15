import React, { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Keyboard, Platform, EmitterSubscription, KeyboardEvent } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Header from '~/components/other/Header'
import { colors } from '~/constants/Colors'
import { getAuth } from '@firebase/auth'
import { Ionicons } from '@expo/vector-icons'
import AutoExpandingInput from '~/components/bobee/AutoExpandingInput'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Constants from 'expo-constants'

export default function ReflectionFlowPage() {
  const { q, options } = useLocalSearchParams<{ q?: string; options?: string }>()
  const router = useRouter()
  const parsedOptions: string[] = (() => {
    if (!options) return []
    try { return JSON.parse(decodeURIComponent(options)) } catch { return [] }
  })()
  const question = q ? decodeURIComponent(q) : 'Reflection'
  const [selected, setSelected] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [firstAiAnswer, setFirstAiAnswer] = useState<string | null>(null)
  const [finalAiAnswer, setFinalAiAnswer] = useState<string | null>(null)
  const [userReply, setUserReply] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [kbVisible, setKbVisible] = useState(false)
  const [kbHeight, setKbHeight] = useState(0)
  const insets = useSafeAreaInsets()
  const scrollRef = useRef<ScrollView | null>(null)
  // no conversationId for reflection-specific chat
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (aiLoading) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      )
      loop.start()
      return () => loop.stop()
    }
    pulseAnim.setValue(1)
  }, [aiLoading, pulseAnim])

  // Keyboard handling to mimic ChatScreen footer behavior
  useEffect(() => {
    // Use precise keyboard height so footer can sit just above it
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const onShow = (e: KeyboardEvent) => {
      setKbVisible(true)
      const height = e.endCoordinates?.height ?? 0
      setKbHeight(height)
    }
    const onHide = () => { setKbVisible(false); setKbHeight(0) }
    const showSub: EmitterSubscription = Keyboard.addListener(showEvt, onShow)
    const hideSub: EmitterSubscription = Keyboard.addListener(hideEvt, onHide)
    return () => { showSub.remove(); hideSub.remove() }
  }, [])

  const close = () => { router.back() }

  const handleSend = async () => {
    if (!input.trim() || !selected || !firstAiAnswer || finalAiAnswer) return
  const reply = input.trim()
  setInput('')
  setUserReply(reply)
    try {
      setAiLoading(true)
      const user = getAuth().currentUser
      if (!user) return
      const token = await user.getIdToken()
      const resp = await fetch(`${API_BASE}/api/bobee/reflection-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reflectionQuestion: question, selectedOption: selected, userReply: reply })
      })
      if (!resp.ok) throw new Error('reflection-final-failed')
      const j = await resp.json() as { answer: string; done?: boolean }
      setFinalAiAnswer(j.answer)
      // Fire rating request (non-blocking)
      try {
        const rateResp = await fetch(`${API_BASE}/api/bobee/rate-reflection`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            reflectionQuestion: question,
            selectedOption: selected,
            userReply: reply,
            aiFollowup: firstAiAnswer,
            aiFinal: j.answer
          })
        })
        if (!rateResp.ok) {
          console.warn('reflection rating failed')
        }
      } catch (e) {
        console.warn('reflection rating error', e)
      }
    } catch (e) {
      setFinalAiAnswer('Sorry, something went wrong.')
    } finally {
      setAiLoading(false)
      setTimeout(() => { scrollRef.current?.scrollToEnd({ animated: true }) }, 60)
    }
  }

  // Offset we actually use so we don't double-count safe area inset
  const keyboardOffset = kbVisible ? Math.max(0, kbHeight - insets.bottom) : 0

  return (
    <View style={styles.container}>
      <Header title="Reflection" leftIcon="chevron-back" onLeftPress={close} />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.chatScroll, { paddingBottom: 120 + keyboardOffset }]} // ensure scrollable area above the footer + keyboard
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* AI Question Bubble */}
        <View style={styles.bubbleWrapper}>
          <View style={[styles.bubble, styles.aiBubble]}>
            <Text style={styles.aiText}>{question}</Text>
          </View>
        </View>

        {/* Options (no echo of selection below; highlight only) */}
        <View style={styles.bubbleWrapper}>
          <View style={[styles.bubble, styles.userBubble]}>
            <Text style={styles.userIntro}>Choose one:</Text>
            {parsedOptions.map((opt, i) => {
              const picked = selected === opt
              return (
                <TouchableOpacity
                  key={i}
                  disabled={!!selected}
                  style={[styles.optionButton, picked && styles.optionButtonSelected]}
                  onPress={async () => {
                    if (selected) return
                    setSelected(opt)
                    try {
                      setAiLoading(true)
                      const user = getAuth().currentUser
                      if (!user) return
                      const token = await user.getIdToken()
                      const resp = await fetch(`${API_BASE}/api/bobee/reflection-message`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ reflectionQuestion: question, selectedOption: opt })
                      })
                      if (!resp.ok) throw new Error('reflection-initial-failed')
                      const j = await resp.json() as { answer: string }
                      setFirstAiAnswer(j.answer)
                      setTimeout(() => { scrollRef.current?.scrollToEnd({ animated: true }) }, 60)
                    } catch (e) {
                      setFirstAiAnswer('Sorry, something went wrong.')
                    } finally {
                      setAiLoading(false)
                    }
                  }}
                >
                  <Text style={[styles.optionButtonText, picked && styles.optionButtonTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
        {selected && aiLoading && !firstAiAnswer && (
          <Animated.View style={[styles.pulseIcon, { transform: [{ scale: pulseAnim }] }]}> 
            <Ionicons name="sparkles" size={24} color={colors.blue} />
          </Animated.View>
        )}

        {/* First AI answer bubble */}
        {firstAiAnswer && (
          <View style={styles.bubbleWrapper}>
            <View style={[styles.bubble, styles.aiBubble]}> 
              <Text style={styles.aiText}>{firstAiAnswer}</Text>
            </View>
          </View>
        )}
        {/* User reply bubble (once user sends) */}
        {firstAiAnswer && userReply && (
          <View style={styles.bubbleWrapper}>
            <View style={[styles.bubble, styles.userBubble]}>
              <Text style={styles.userText}>{userReply}</Text>
            </View>
            {/* Loading icon while waiting for final AI answer */}
            {aiLoading && !finalAiAnswer && (
              <Animated.View style={[styles.pulseIcon, { transform: [{ scale: pulseAnim }] }]}> 
                <Ionicons name="sparkles" size={24} color={colors.blue} />
              </Animated.View>
            )}
          </View>
        )}
        {/* Final AI answer */}
        {finalAiAnswer && (
          <View style={styles.bubbleWrapper}>
            <View style={[styles.bubble, styles.aiBubble]}> 
              <Text style={styles.aiText}>{finalAiAnswer}</Text>
            </View>
            <TouchableOpacity style={styles.doneButton} onPress={close} activeOpacity={0.85}>
              <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.doneButtonText}>Finish Reflection</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Input footer appears only after first AI answer and before final answer */}
      {selected && firstAiAnswer && !finalAiAnswer && (
        <View style={[styles.footer, { bottom: keyboardOffset }]}> 
          <View style={styles.inputContainer}>
            <AutoExpandingInput
              value={input}
              onChangeText={setInput}
              placeholder="Type your reply"
              placeholderTextColor="rgba(107, 107, 107, 1)"
              minHeight={25}
              maxHeight={120}
              style={styles.input}
              editable={!aiLoading}
              returnKeyType="send"
              onSubmitEditing={() => { if (input.trim()) handleSend() }}
              blurOnSubmit={false}
            />
          </View>
          <View style={[styles.buttonsRow, { paddingBottom: kbVisible ? 10 : Math.max(insets.bottom, 12) }]}> 
            <View style={styles.leftButtons} />
            <TouchableOpacity onPress={handleSend} disabled={!input.trim() || aiLoading} style={[styles.sendButton, (!input.trim() || aiLoading) && { opacity: 0.4 }]}>
              <Ionicons name="arrow-up" size={20} color={'white'} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}


const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor: colors.lightest },
  chatScroll: { padding: 20, paddingBottom: 120 },
  bubbleWrapper: { marginBottom: 12 },
  bubble: { borderRadius: 16, padding: 14, maxWidth: '88%' },
  aiBubble: { backgroundColor: colors.darkblue, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  userBubble: { backgroundColor: colors.lighter, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiText: { color: '#fff', fontFamily: 'SpaceMono', fontSize: 15, lineHeight: 22 },
  userText: { color: '#333', fontFamily: 'SpaceMono', fontSize: 15, lineHeight: 22 },
  userIntro: { color: '#333', fontFamily: 'SpaceMono', fontSize: 13, marginBottom: 10 },
  optionButton: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e2e6ec' },
  optionButtonText: { fontFamily: 'SpaceMono', fontSize: 14, color: colors.darkest },
  optionButtonSelected: { backgroundColor: colors.darkblue, borderColor: colors.darkblue },
  optionButtonTextSelected: { color: '#fff', fontWeight: '600' },
  doneButton: { marginTop: 28, alignSelf: 'center', backgroundColor: colors.blue, paddingVertical: 14, paddingHorizontal: 26, borderRadius: 30, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  doneButtonText: { color: '#fff', fontFamily: 'SpaceMono', fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10, elevation: 10, backgroundColor: colors.lightest },
  inputContainer: { borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: 'white', paddingHorizontal: 18, paddingTop: 8, borderWidth: 1, borderColor: colors.lighter, borderBottomWidth: 0 },
  input: { flex: 1, fontFamily: 'SpaceMono', fontSize: 15, letterSpacing: 0.3, lineHeight: 22, color: '#333' },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 12, paddingTop: 12 },
  leftButtons: { flexDirection: 'row', gap: 6 },
  sendButton: { marginLeft: 8, padding: 7, backgroundColor: colors.blue, borderRadius: 500 },
  sendButtonText: { color: '#fff', fontFamily: 'SpaceMono', fontSize: 14 },
  loadingIconWrap: { alignSelf: 'flex-start', marginTop: 6, marginLeft: 4 },
  inlineLoadingIcon: { position: 'absolute', right: 10, top: 10 },
  pulseIcon: { alignSelf: 'flex-start', marginTop: 8, marginLeft: 4 }
})
