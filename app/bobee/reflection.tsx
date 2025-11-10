import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Keyboard,
  Platform
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Header from '~/components/other/Header'
import { colors } from '~/constants/Colors'
import { getAuth } from '@firebase/auth'
import { Ionicons } from '@expo/vector-icons'
import AutoExpandingInput from '~/components/bobee/AutoExpandingInput'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { KeyboardAvoidingView } from 'react-native'

export default function ReflectionFlowPage() {
  const { q, options } = useLocalSearchParams<{ q?: string; options?: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

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
  const scrollRef = useRef<ScrollView | null>(null)

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

  // Always keep view pinned to the bottom when content grows or keyboard opens
  useEffect(() => {
    const sub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => scrollRef.current?.scrollToEnd({ animated: true })
    )
    return () => sub.remove()
  }, [])

  // Also pin after relevant state changes (AI/user messages)
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true })
  }, [firstAiAnswer, userReply, finalAiAnswer])

  const close = () => { router.back() }

  const handleSend = async () => {
    if (!input.trim() || !selected || !firstAiAnswer || finalAiAnswer) return
    const reply = input.trim()
    setInput('')
    setUserReply(reply)
    scrollRef.current?.scrollToEnd({ animated: true })

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

      // Fire-and-forget rating
      try {
        await fetch(`${API_BASE}/api/bobee/rate-reflection`, {
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
      } catch (e) {
        console.warn('reflection rating error', e)
      }
    } catch (e) {
      setFinalAiAnswer('Sorry, something went wrong.')
    } finally {
      setAiLoading(false)
      scrollRef.current?.scrollToEnd({ animated: true })
    }
  }

  return (
    <View style={styles.container}>
      <Header title="Reflection" leftIcon="chevron-back" onLeftPress={close} />

      {/* KAV ensures footer stays above keyboard on both platforms */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.select({
          ios: 0,          // Header doesn't overlap content on iOS here
          android: 0
        })}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.chatScroll, { paddingBottom: 16 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {/* AI Question Bubble */}
          <View style={styles.bubbleWrapper}>
            <View style={[styles.bubble, styles.aiBubble]}>
              <Text style={styles.aiText}>{question}</Text>
            </View>
          </View>

          {/* Options */}
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
                      } catch (e) {
                        setFirstAiAnswer('Sorry, something went wrong.')
                      } finally {
                        setAiLoading(false)
                        scrollRef.current?.scrollToEnd({ animated: true })
                      }
                    }}
                  >
                    <Text style={[styles.optionButtonText, picked && styles.optionButtonTextSelected]}>
                      {opt}
                    </Text>
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

          {/* First AI answer */}
          {firstAiAnswer && (
            <View style={styles.bubbleWrapper}>
              <View style={[styles.bubble, styles.aiBubble]}>
                <Text style={styles.aiText}>{firstAiAnswer}</Text>
              </View>
            </View>
          )}

          {/* User reply */}
          {firstAiAnswer && userReply && (
            <View style={styles.bubbleWrapper}>
              <View style={[styles.bubble, styles.userBubble]}>
                <Text style={styles.userText}>{userReply}</Text>
              </View>
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

        {/* Footer lives inside the KAV and is NOT absolute, so it rides above the keyboard */}
        {selected && firstAiAnswer && !finalAiAnswer && (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
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
              <TouchableOpacity
                onPress={handleSend}
                disabled={!input.trim() || aiLoading}
                style={[styles.sendButton, (!input.trim() || aiLoading) && { opacity: 0.4 }]}
              >
                <Ionicons name="arrow-up" size={20} color={'white'} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightest },
  flex: { flex: 1 },

  chatScroll: { padding: 20 },

  bubbleWrapper: { marginBottom: 12 },
  bubble: { borderRadius: 16, padding: 14, maxWidth: '88%' },
  aiBubble: { backgroundColor: colors.darkblue, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  userBubble: { backgroundColor: colors.lighter, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiText: { color: '#fff', fontFamily: 'SpaceMono', fontSize: 15, lineHeight: 22 },
  userText: { color: '#333', fontFamily: 'SpaceMono', fontSize: 15, lineHeight: 22 },
  userIntro: { color: '#333', fontFamily: 'SpaceMono', fontSize: 13, marginBottom: 10 },

  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e6ec'
  },
  optionButtonText: { fontFamily: 'SpaceMono', fontSize: 14, color: colors.darkest },
  optionButtonSelected: { backgroundColor: colors.darkblue, borderColor: colors.darkblue },
  optionButtonTextSelected: { color: '#fff', fontWeight: '600' },

  doneButton: {
    marginTop: 28,
    alignSelf: 'center',
    backgroundColor: colors.blue,
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3
  },
  doneButtonText: { color: '#fff', fontFamily: 'SpaceMonoSemibold', fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },

  // Footer sits inside KAV; no absolute positioning
  footer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: colors.lighter,
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'SpaceMono',
    fontSize: 15,
    letterSpacing: 0.3,
    lineHeight: 22,
    color: '#333',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.lighter,
    borderRadius: 12,
  },
  sendButton: { padding: 10, backgroundColor: colors.blue, borderRadius: 999 },

  pulseIcon: { alignSelf: 'flex-start', marginTop: 8, marginLeft: 4 }
})
