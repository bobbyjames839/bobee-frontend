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
import { useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AutoExpandingInput from '../other/AutoExpandingInput'
import { colors } from '~/constants/Colors'
import { ColorSpace } from 'react-native-reanimated'

type ChatHistoryItem = {
  question: string
  answer?: string
}

const SUGGESTIONS: Array<{
  title: string
  description: string
  text: string
}> = [
  {
    title: 'Write me a summary',
    description: 'of how I am feeling right now',
    text: 'Hey, can you write me a summary based on how I am feeling at the moment?'
  },
  {
    title: 'Plan my evening',
    description: 'with some relaxing activities',
    text: 'Can you plan my evening with a few relaxing activities to help me unwind?'
  },
  {
    title: 'Identify patterns',
    description: 'from my recent entries',
    text: 'Could you identify any patterns from my recent journal entries?'
  },
  {
    title: 'Give me motivation',
    description: 'for my goals today',
    text: 'Can you give me some motivation to help me achieve my goals today?'
  },
  {
    title: 'Check my progress',
    description: 'on recent habits',
    text: 'Could you check my progress on the habits I have been tracking recently?'
  }
]

export default function ChatScreen({
  history,
  scrollRef,
  pulseAnim,
  input,
  setInput,
  isLoading,
  onSubmit,
  isTabBarVisible = false,
}: {
  history: ChatHistoryItem[]
  scrollRef: React.RefObject<ScrollView | null>
  pulseAnim: Animated.Value
  input: string
  setInput: (s: string) => void
  isLoading: boolean
  onSubmit: () => void
  isTabBarVisible?: boolean
}) {
  const busy = isLoading
  const insets = useSafeAreaInsets()
  const [kbVisible, setKbVisible] = useState(false)
  const [kbHeight, setKbHeight] = useState(0)
  const [inputLineCount, setInputLineCount] = useState(1)
  const showSuggestions = history.length === 0 && input.trim().length === 0
  const footerHeight = showSuggestions ? 200 : 120
  const footerBottomAnim = useRef(new Animated.Value(0)).current
  
  // Animate footer bottom position when tab bar visibility changes
  useEffect(() => {
    Animated.timing(footerBottomAnim, {
      toValue: isTabBarVisible ? 70 : 0,
      duration: isTabBarVisible ? 350 : 250,
      useNativeDriver: false,
    }).start();
  }, [isTabBarVisible, footerBottomAnim]);

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
          { paddingBottom: footerHeight + kbHeight },
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
              Ask anything about your day, mood, habits or goals.
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
      <Animated.View style={[styles.footer, { bottom: footerBottomAnim, paddingBottom: buttonsBottomPad }]}>
        {showSuggestions && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsContent}
            style={styles.suggestionsRow}
          >
            {SUGGESTIONS.map((item, index) => (
              <TouchableOpacity
                key={item.title}
                style={[
                  styles.suggestionCard,
                  index !== SUGGESTIONS.length - 1 && styles.suggestionSpacing,
                ]}
                activeOpacity={0.8}
                onPress={() => setInput(item.text)}
              >
                <Text style={styles.suggestionTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.suggestionDescription} numberOfLines={1}>{item.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
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
      </Animated.View>

  {/* Paywall removed */}
    </View>
  )
}

// Helper to parse bold text **text** into Text components
function parseBoldText(text: string) {
  const parts: Array<{ text: string; bold: boolean }> = []
  const regex = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({ text: text.substring(lastIndex, match.index), bold: false })
    }
    // Add the bold text (without the **)
    parts.push({ text: match[1], bold: true })
    lastIndex = regex.lastIndex
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ text: text.substring(lastIndex), bold: false })
  }

  return parts
}

function renderStructuredAnswer(raw: string) {
  const clean = raw.trim()
  if (!clean) return null
  const paragraphs = clean
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)

  return (
    <View>
      {paragraphs.map((para, i) => {
        const lines = para.split(/\n+/).map(l => l.trim()).filter(Boolean)
        
        // Check for ALL CAPS header (4+ chars, all uppercase)
        const isHeader = lines.length === 1 && /^[A-Z\s]{4,}:?$/.test(lines[0])
        if (isHeader) {
          return (
            <Text key={i} style={[styles.sectionHeader, i > 0 && styles.paragraphGap]}>
              {lines[0]}
            </Text>
          )
        }
        
        // Check for bullet list (lines starting with optional spaces then • or -)
        const bulletLines = lines.filter(l => /^\s*[•\-]\s+/.test(l))
        const isBulletBlock = bulletLines.length >= 2 && bulletLines.length === lines.length

        if (isBulletBlock) {
          return (
            <View key={i} style={i > 0 ? styles.paragraphGap : undefined}>
              {lines.map((line, li) => {
                // Extract leading spaces to determine indent level
                const indentMatch = line.match(/^(\s*)[•\-]\s+/)
                const indentSpaces = indentMatch ? indentMatch[1].length : 0
                const indentLevel = Math.floor(indentSpaces / 2)
                const text = line.replace(/^\s*[•\-]\s+/, '')
                const parts = parseBoldText(text)
                return (
                  <View key={li} style={[styles.bulletRow, { marginLeft: indentLevel * 16 + 8 }]}>
                    <Text style={styles.bulletSymbol}>•</Text>
                    <Text style={styles.bulletText}>
                      {parts.map((part, pi) => (
                        <Text key={pi} style={part.bold ? styles.boldText : undefined}>
                          {part.text}
                        </Text>
                      ))}
                    </Text>
                  </View>
                )
              })}
            </View>
          )
        }

        // Check for numbered list (lines starting with 1., 2., etc.)
        const numberedLines = lines.filter(l => /^\d+\.\s+/.test(l))
        const isNumberedBlock = numberedLines.length >= 2 && numberedLines.length === lines.length

        if (isNumberedBlock) {
          return (
            <View key={i} style={i > 0 ? styles.paragraphGap : undefined}>
              {lines.map((line, li) => {
                const match = line.match(/^(\d+)\.\s+(.*)/)
                if (!match) return null
                const number = match[1]
                const text = match[2]
                const parts = parseBoldText(text)
                return (
                  <View key={li} style={styles.numberedRow}>
                    <Text style={styles.numberText}>{number}.</Text>
                    <Text style={styles.numberedText}>
                      {parts.map((part, pi) => (
                        <Text key={pi} style={part.bold ? styles.boldText : undefined}>
                          {part.text}
                        </Text>
                      ))}
                    </Text>
                  </View>
                )
              })}
            </View>
          )
        }

        // Check for indented lines (start with 2+ spaces)
        const hasIndentedLines = lines.some(l => /^\s{2,}/.test(l))
        if (hasIndentedLines) {
          return (
            <View key={i} style={i > 0 ? styles.paragraphGap : undefined}>
              {lines.map((line, li) => {
                const indentMatch = line.match(/^(\s+)/)
                const indentLevel = indentMatch ? Math.floor(indentMatch[1].length / 2) : 0
                const text = line.trim()
                const parts = parseBoldText(text)
                return (
                  <Text 
                    key={li} 
                    style={[
                      styles.aiText, 
                      indentLevel > 0 && { marginLeft: indentLevel * 16, marginTop: 4 }
                    ]}
                  >
                    {parts.map((part, pi) => (
                      <Text key={pi} style={part.bold ? styles.boldText : undefined}>
                        {part.text}
                      </Text>
                    ))}
                  </Text>
                )
              })}
            </View>
          )
        }

        // Regular paragraph
        const paragraphText = lines.join('\n')
        const parts = parseBoldText(paragraphText)
        return (
          <Text key={i} style={[styles.aiText, i > 0 && styles.paragraphGap]}>
            {parts.map((part, pi) => (
              <Text key={pi} style={part.bold ? styles.boldText : undefined}>
                {part.text}
              </Text>
            ))}
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
  emptyText:{ fontFamily:'SpaceMono', fontSize:14, color:colors.dark, marginTop:5, textAlign:'center', lineHeight:20, width:270 },
  bubbleWrapper: { marginBottom: 8 },
  bubble: { borderRadius: 16, padding: 14, maxWidth: '85%' },
  userBubble: {
    backgroundColor: colors.lightestblue,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderRadius: 16,
    marginTop: 8,
    maxWidth: '100%',
  },
  userText: {
    color: colors.darkest,
    fontFamily: 'SpaceMono',
    fontSize: 15,
    lineHeight: 22,
  },
  aiText: {
    color: colors.darkest,
    fontFamily: 'SpaceMono',
    fontSize: 15,
    lineHeight: 22,
  },
  paragraphGap: {
    marginTop: 18,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  bulletSymbol: {
    color: colors.darkest,
    fontFamily: 'SpaceMono',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 0,
  },
  bulletText: {
    flex: 1,
    color: colors.darkest,
    fontFamily: 'SpaceMono',
    fontSize: 15,
    lineHeight: 22,
  },
  boldText: {
    fontFamily: 'SpaceMonoBold',
    fontWeight: '600',
  },
  sectionHeader: {
    color: colors.darkest,
    fontFamily: 'SpaceMonoBold',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  numberedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  numberText: {
    color: colors.darkest,
    fontFamily: 'SpaceMonoBold',
    fontSize: 15,
    lineHeight: 22,
    minWidth: 24,
  },
  numberedText: {
    flex: 1,
    color: colors.darkest,
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
    backgroundColor: colors.lightest,
    paddingTop: 10,
    left: 0,
    right: 0,
    zIndex: 10,
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
  suggestionsRow: {
    maxHeight: 110,
    width: '100%',
  },
  suggestionsContent: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  suggestionCard: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.lighter,
    justifyContent: 'center',
  },
  suggestionSpacing: {
    marginRight: 10,
  },
  suggestionTitle: {
    fontFamily: 'SpaceMonoSemibold',
    fontSize: 15,
    color: colors.darkest,
    marginBottom: 6,
  },
  suggestionDescription: {
    fontFamily: 'SpaceMono',
    fontSize: 13,
    color: colors.dark,
    lineHeight: 18,
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
