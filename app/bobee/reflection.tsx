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
import { colors } from '~/constants/Colors'
import { getAuth } from '@firebase/auth'
import { Ionicons } from '@expo/vector-icons'
import { X } from 'lucide-react-native'
import { useBobeeData } from '~/context/BobeeContext'
import AutoExpandingInput from '~/components/other/AutoExpandingInput'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { KeyboardAvoidingView } from 'react-native'

// Helper to parse bold text **text** into Text components
function parseBoldText(text: string) {
  const parts: Array<{ text: string; bold: boolean }> = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({ text: text.substring(lastIndex, match.index), bold: false });
    }
    // Add the bold text (without the **)
    parts.push({ text: match[1], bold: true });
    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ text: text.substring(lastIndex), bold: false });
  }

  return parts;
}

function renderStructuredAnswer(raw: string) {
  const clean = raw.trim();
  if (!clean) return null;
  const paragraphs = clean
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <View>
      {paragraphs.map((para, i) => {
        const lines = para
          .split(/\n+/)
          .map((l) => l.trim())
          .filter(Boolean);

        // Check for ALL CAPS header (4+ chars, all uppercase)
        const isHeader =
          lines.length === 1 && /^[A-Z\s]{4,}:?$/.test(lines[0]);
        if (isHeader) {
          return (
            <Text
              key={i}
              style={[styles.sectionHeader, i > 0 && styles.paragraphGap]}
            >
              {lines[0]}
            </Text>
          );
        }

        // Check for bullet list (lines starting with optional spaces then • or -)
        const bulletLines = lines.filter((l) => /^\s*[•\-]\s+/.test(l));
        const isBulletBlock =
          bulletLines.length >= 2 && bulletLines.length === lines.length;

        if (isBulletBlock) {
          return (
            <View key={i} style={i > 0 ? styles.paragraphGap : undefined}>
              {lines.map((line, li) => {
                // Extract leading spaces to determine indent level
                const indentMatch = line.match(/^(\s*)[•\-]\s+/);
                const indentSpaces = indentMatch ? indentMatch[1].length : 0;
                const indentLevel = Math.floor(indentSpaces / 2);
                const text = line.replace(/^\s*[•\-]\s+/, "");
                const parts = parseBoldText(text);
                return (
                  <View
                    key={li}
                    style={[
                      styles.bulletRow,
                      { marginLeft: indentLevel * 16 + 8 },
                    ]}
                  >
                    <Text style={styles.bulletSymbol}>•</Text>
                    <Text style={styles.bulletText}>
                      {parts.map((part, pi) => (
                        <Text
                          key={pi}
                          style={part.bold ? styles.boldText : undefined}
                        >
                          {part.text}
                        </Text>
                      ))}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        }

        // Check for numbered list (lines starting with 1., 2., etc.)
        const numberedLines = lines.filter((l) => /^\d+\.\s+/.test(l));
        const isNumberedBlock =
          numberedLines.length >= 2 && numberedLines.length === lines.length;

        if (isNumberedBlock) {
          return (
            <View key={i} style={i > 0 ? styles.paragraphGap : undefined}>
              {lines.map((line, li) => {
                const match = line.match(/^(\d+)\.\s+(.*)/);                if (!match) return null;
                const number = match[1];
                const text = match[2];
                const parts = parseBoldText(text);
                return (
                  <View key={li} style={styles.numberedRow}>
                    <Text style={styles.numberText}>{number}.</Text>
                    <Text style={styles.numberedText}>
                      {parts.map((part, pi) => (
                        <Text
                          key={pi}
                          style={part.bold ? styles.boldText : undefined}
                        >
                          {part.text}
                        </Text>
                      ))}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        }

        // Check for indented lines (start with 2+ spaces)
        const hasIndentedLines = lines.some((l) => /^\s{2,}/.test(l));
        if (hasIndentedLines) {
          return (
            <View key={i} style={i > 0 ? styles.paragraphGap : undefined}>
              {lines.map((line, li) => {
                const indentMatch = line.match(/^(\s+)/);
                const indentLevel = indentMatch
                  ? Math.floor(indentMatch[1].length / 2)
                  : 0;
                const text = line.trim();
                const parts = parseBoldText(text);
                return (
                  <Text
                    key={li}
                    style={[
                      styles.aiText,
                      indentLevel > 0 && {
                        marginLeft: indentLevel * 16,
                        marginTop: 4,
                      },
                    ]}
                  >
                    {parts.map((part, pi) => (
                      <Text
                        key={pi}
                        style={part.bold ? styles.boldText : undefined}
                      >
                        {part.text}
                      </Text>
                    ))}
                  </Text>
                );
              })}
            </View>
          );
        }

        // Regular paragraph
        const paragraphText = lines.join("\n");
        const parts = parseBoldText(paragraphText);
        return (
          <Text key={i} style={[styles.aiText, i > 0 && styles.paragraphGap]}>
            {parts.map((part, pi) => (
              <Text key={pi} style={part.bold ? styles.boldText : undefined}>
                {part.text}
              </Text>
            ))}
          </Text>
        );
      })}
    </View>
  );
}

export default function ReflectionFlowPage() {
  const { q, options } = useLocalSearchParams<{ q?: string; options?: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { markReflectionComplete } = useBobeeData()

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
  const [inputLineCount, setInputLineCount] = useState(1)

  const scrollRef = useRef<ScrollView | null>(null)
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string
  const pulseAnim = useRef(new Animated.Value(1)).current

  const [kbShown, setKbShown] = useState(false)
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const s = Keyboard.addListener(showEvt, () => setKbShown(true))
    const h = Keyboard.addListener(hideEvt, () => setKbShown(false))
    return () => { s.remove(); h.remove() }
  }, [])

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

  useEffect(() => {
    const evt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const sub = Keyboard.addListener(evt, () => scrollRef.current?.scrollToEnd({ animated: true }))
    return () => sub.remove()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true })
  }, [firstAiAnswer, userReply, finalAiAnswer])

  const footerBottomPad = kbShown ? 10 : 25
  const replyActive = Boolean(selected && firstAiAnswer && !finalAiAnswer)


  const close = () => { 
    router.replace('/(tabs)/bobee?refresh=true')
  }

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
      markReflectionComplete()

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
      <View style={styles.headerContainer}>
        <View style={styles.headerButtonDraft} />
        <Text style={styles.headerTitle}>Reflection</Text>
        <TouchableOpacity onPress={() => (router.back())} style={styles.headerButton}>
          <X size={22} color={colors.darkest} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.flex} 
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.chatScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          <View style={styles.bubbleWrapper}>
            <View style={[styles.bubble, styles.aiBubble]}>
              <Text style={styles.aiText}>{question}</Text>
            </View>
          </View>

          <View style={styles.bubbleWrapper}>
            <View style={[styles.bubble, styles.userBubble]}>
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
              <View style={styles.pulseCircle} />
            </Animated.View>
          )}

          {/* First AI answer */}
          {firstAiAnswer && (
            <View style={styles.bubbleWrapper}>
              <View style={[styles.bubble, styles.aiBubble]}>
                {renderStructuredAnswer(firstAiAnswer)}
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
                  <View style={styles.pulseCircle} />
                </Animated.View>
              )}
            </View>
          )}

          {/* Final AI answer */}
          {finalAiAnswer && (
            <View style={styles.bubbleWrapper}>
              <View style={[styles.bubble, styles.aiBubble]}>
                {renderStructuredAnswer(finalAiAnswer)}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Reply footer (when in conversation) */}
        {replyActive && (
          <View style={[styles.footer, { paddingBottom: footerBottomPad }]}>
            <View style={styles.footerBottom}>
              <AutoExpandingInput
                value={input}
                onChangeText={setInput}
                placeholder="Type your reply"
                placeholderTextColor="rgba(107, 107, 107, 1)"
                minHeight={22}
                maxHeight={120}
                style={styles.input}
                editable={!aiLoading}
                returnKeyType="send"
                onSubmitEditing={() => { if (input.trim()) handleSend() }}
                blurOnSubmit={false}
                onLineCountChange={setInputLineCount}
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={!input.trim() || aiLoading}
                style={styles.sendButton}
              >
                <Ionicons name="arrow-up" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {finalAiAnswer && (
            <TouchableOpacity style={styles.actionBarButton} onPress={close} activeOpacity={0.9}>
              <Ionicons name="checkmark" size={22} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.actionBarText}>Finish Reflection</Text>
            </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightest },
  flex: { flex: 1 },

  headerContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  headerButton: {
    height: 42,
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  headerButtonDraft: {
    height: 42,
    width: 42
  },
  headerTitle: {
    fontFamily: 'SpaceMonoSemibold',
    fontSize: 18,
    color: colors.darkest,
  },

  chatScroll: { padding: 20 },

  bubbleWrapper: { marginBottom: 12 },
  bubble: { borderRadius: 16, padding: 14 },
  aiBubble: { width: '100%', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  userBubble: { backgroundColor: colors.lightestblue, alignSelf: 'flex-end', borderBottomRightRadius: 4, maxWidth: '88%' },
  aiText: { color: colors.darkest, fontFamily: 'SpaceMono', fontSize: 15, lineHeight: 22 },
  userText: { color: '#333', fontFamily: 'SpaceMono', fontSize: 15, lineHeight: 22 },

  optionButton: {
    backgroundColor: '#f2f2fdff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 4,
  },
  optionButtonText: { fontFamily: 'SpaceMono', fontSize: 14, color: colors.darkest },
  optionButtonSelected: { backgroundColor: colors.blue },
  optionButtonTextSelected: { color: '#fff', fontWeight: '600' },

  // Footer (reply input)
  footer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 10,
    paddingTop: 10,
    elevation: 10,
  },
  footerBottom: {
    width: '93%',
    paddingHorizontal: 5,
    paddingLeft: 16,
    borderRadius: 27,
    paddingVertical: 5,
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

  actionBarButton: {
    width: '100%',
    backgroundColor: colors.blue,
    borderRadius: 22,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBarText: {
    color: '#fff',
    fontFamily: 'SpaceMonoSemibold',
    fontSize: 18,
    letterSpacing: 0.5
  },

  pulseIcon: { alignSelf: 'flex-start', marginTop: 8 },
  pulseCircle: {
    width: 10,
    marginTop: 5,
    marginLeft: 10,
    height: 10,
    borderRadius: 50,
    backgroundColor: colors.blue,
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
})
