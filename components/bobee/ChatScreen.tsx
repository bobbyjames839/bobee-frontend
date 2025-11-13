// ChatScreen.tsx
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react'
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Keyboard,
  Platform,
  EmitterSubscription,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AutoExpandingInput from './AutoExpandingInput'
import { colors } from '~/constants/Colors'
// Subscription gating removed – reasoning now always visible

type ChatHistoryItem = {
  question: string
  answer?: string
}

export default function ChatScreen({
  history,
  scrollRef,
  pulseAnim,
  input,
  setInput,
  isLoading,
  onSubmit,
}: {
  history: ChatHistoryItem[]
  scrollRef: React.RefObject<ScrollView | null>
  pulseAnim: Animated.Value
  input: string
  setInput: (s: string) => void
  isLoading: boolean
  onSubmit: () => void
}) {
  const router = useRouter()
  const busy = isLoading
  const insets = useSafeAreaInsets()
  const [kbVisible, setKbVisible] = useState(false)
  const [kbHeight, setKbHeight] = useState(0)
  const [inputLineCount, setInputLineCount] = useState(1)

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    const onShow = (e: any) => {
      setKbVisible(true)
      // Set a small extra padding for the ScrollView
      setKbHeight(30)
    }

    const onHide = (e: any) => {
      setKbVisible(false)
      setKbHeight(0)
    }

    const showSub: EmitterSubscription = Keyboard.addListener(showEvt, onShow)
    const hideSub: EmitterSubscription = Keyboard.addListener(hideEvt, onHide)
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [insets.bottom])

  // Dynamic paddings (smaller when keyboard hidden)
  const buttonsBottomPad = kbVisible ? 10 : 25

  // Ensure footer/input collapses when leaving this screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        setInput('')
      }
    }, [setInput])
  )

  // Track mount status to prevent modal flash after unmount
  const isMountedRef = useRef(true)
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])



  return (
    <View style={styles.flex}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: 120 + kbHeight }, 
        ]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={false} 
        keyboardDismissMode="interactive" 
      >
        {history.length === 0 && !isLoading && (
          <View style={styles.emptyWrap}>
            <Image source={require('~/assets/images/happy.png')} style={styles.emptyImage} resizeMode="contain" />
            <Text style={styles.emptyTitle}>Start a fresh chat</Text>
            <Text style={styles.emptyText}>
              Ask anything about your day, mood, habits or goals. I'll give you a thoughtful, structured reply—no fluff.
            </Text>
          </View>
        )}
        {history.map((item, idx) => (
          <View key={idx} style={styles.bubbleWrapper}>
            <View style={[styles.bubble, styles.userBubble]}>
              <Text style={styles.userText}>{item.question}</Text>
            </View>

            {item.answer ? (
              <View style={[styles.bubble, styles.aiBubble]}>
                {renderStructuredAnswer(item.answer)}
              </View>
            ) : (
              isLoading &&
              idx === history.length - 1 && (
                <Animated.View
                  style={[styles.pulseIcon, { transform: [{ scale: pulseAnim }] }]}
                >
                  <Ionicons name="sparkles" size={24} color={colors.blue} />
                </Animated.View>
              )
            )}
          </View>
        ))}
      </ScrollView>

      {/* Footer pinned to bottom: input above buttons */}
      <View style={[styles.footer, { paddingBottom: buttonsBottomPad }]}>
        <View style={styles.footerBottom}>
          <AutoExpandingInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything"
            placeholderTextColor="rgba(107, 107, 107, 1)"
            minHeight={22}
            maxHeight={120}
            style={styles.input}
            editable={!busy}
            returnKeyType="send"
            onSubmitEditing={onSubmit}
            blurOnSubmit={false}
            onLineCountChange={setInputLineCount}
          />
          <TouchableOpacity onPress={onSubmit} disabled={busy} style={styles.sendButton}>
            <Ionicons name="arrow-up" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

  {/* Paywall removed */}
    </View>
  )
}

// Helper to structure AI answer: supports multi-paragraph and simple bullet lists.
function renderStructuredAnswer(raw: string) {
  const clean = raw.trim()
  if (!clean) return null
  // Split paragraphs by 2+ newlines OR a blank line
  const paragraphs = clean
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)

  return (
    <View>
      {paragraphs.map((para, i) => {
        // Detect if paragraph is primarily a bullet list (≥2 bullet lines)
        const lines = para.split(/\n+/).map(l => l.trim()).filter(Boolean)
        const bulletLines = lines.filter(l => /^[•\-]\s+/.test(l))
        const isBulletBlock = bulletLines.length >= 2 && bulletLines.length === lines.length

        if (isBulletBlock) {
          return (
            <View key={i} style={i > 0 ? styles.paragraphGap : undefined}>
              {lines.map((line, li) => {
                const text = line.replace(/^[•\-]\s+/, '')
                return (
                  <View key={li} style={styles.bulletRow}>
                    <Text style={styles.bulletSymbol}>•</Text>
                    <Text style={styles.bulletText}>{text}</Text>
                  </View>
                )
              })}
            </View>
          )
        }

        // Otherwise treat as normal paragraph (preserve single newlines within)
        return (
          <Text key={i} style={[styles.aiText, i > 0 && styles.paragraphGap]}>
            {lines.join('\n')}
          </Text>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightest },
  container: { padding: 20, paddingBottom: 10 },
  emptyWrap:{ alignItems:'center', marginTop:150, paddingHorizontal:10 },
  emptyImage:{ width:120, height:120, borderRadius: 40, borderWidth:1, borderColor:colors.darkestblue },
  emptyTitle:{ fontFamily:'SpaceMonoSemibold', fontSize:18, color:colors.darkest, marginTop:10 },
  emptyText:{ fontFamily:'SpaceMono', fontSize:14, color:colors.dark, marginTop:5, textAlign:'center', lineHeight:20 },
  bubbleWrapper: { marginBottom: 8 },
  bubble: { borderRadius: 16, padding: 14, maxWidth: '85%' },
  userBubble: {
    backgroundColor: colors.lighter,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.darkblue,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: 8,
  },
  aiReasoningBubble: {
    backgroundColor: colors.darkblue,
    width: '90%',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 16,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginTop: 4,
  },
  userText: {
    color: '#333',
    fontFamily: 'SpaceMono',
    fontSize: 15,
    lineHeight: 22,
  },
  aiText: {
    color: '#fff',
    fontFamily: 'SpaceMono',
    fontSize: 15,
    lineHeight: 22,
  },
  paragraphGap: {
    marginTop: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  bulletSymbol: {
    color: '#fff',
    fontFamily: 'SpaceMono',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 0,
  },
  bulletText: {
    flex: 1,
    color: '#fff',
    fontFamily: 'SpaceMono',
    fontSize: 15,
    lineHeight: 22,
  },
  aiFollowupText: {
    fontFamily: 'SpaceMono',
    fontSize: 15,
    lineHeight: 22,
    color: '#fff',
    marginTop: 4,
  },
  reasoningText: {
    color: colors.lightest,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'SpaceMono',
  },
  divider: { height: 1, marginVertical: 8 },
  reasoningButton: { alignSelf: 'flex-start', marginTop: 4 },
  reasoningButtonText: {
    fontFamily: 'SpaceMono',
    fontSize: 13,
    color: colors.blue,
  },
  pulseIcon: { alignSelf: 'flex-start', marginTop: 8 },

  // Footer pinned at bottom; input above buttons
  footer: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    elevation: 10,
  },
  footerBottom: {
    width: '93%',
    paddingHorizontal: 8,
    paddingLeft: 16,
    borderRadius: 27,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.lighter,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    alignItems: 'center',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 15,
    letterSpacing: 0.3,
    color: colors.darkest,
    lineHeight: 22,
    marginBottom: 7,
  },
  sendButton: {
    marginLeft: 3,
    padding: 7,
    backgroundColor: colors.blue,
    borderRadius: 500,
    alignSelf: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  savingCard: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  savingText: {
    marginTop: 10,
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: colors.darkest,
  },

  paywallCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '85%',
    alignItems: 'center',
  },
  paywallTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkest,
    marginBottom: 8,
    textAlign: 'center',
  },
  paywallDesc: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  paywallButton: {
    backgroundColor: colors.blue,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  paywallButtonText: {
    color: '#fff',
    fontFamily: 'SpaceMono',
    fontSize: 15,
  },
  paywallCancel: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: colors.blue,
    marginTop: 12,
  },
})
