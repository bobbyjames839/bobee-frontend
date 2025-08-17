import React, { useContext, useRef, useEffect, useState } from 'react'
import { View, ScrollView, Text, TouchableOpacity, Animated, StyleSheet, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import AutoExpandingInput from './AutoExpandingInput'
import SpinningLoader from '~/components/other/SpinningLoader'
import { colors } from '~/constants/Colors'
import { SubscriptionContext } from '~/context/SubscriptionContext'

type ChatHistoryItem = {
  question: string
  answer?: string
  reasoning?: string
  followup?: string
}

export default function ChatScreen({
  history,
  expanded,
  toggleReasoning,
  scrollRef,
  pulseAnim,
  input,
  setInput,
  isLoading,
  onSubmit,
  isSaving = false,
}: {
  history: ChatHistoryItem[]
  expanded: Set<number>
  toggleReasoning: (i: number) => void
  scrollRef: React.RefObject<ScrollView | null>
  pulseAnim: Animated.Value
  input: string
  setInput: (s: string) => void
  isLoading: boolean
  onSubmit: () => void
  isSaving?: boolean
}) {
  const { isSubscribed } = useContext(SubscriptionContext)
  const router = useRouter()
  const [showPaywall, setShowPaywall] = useState(false)
  const busy = isLoading || isSaving

  // Track mount status to prevent flash after unmount
  const isMountedRef = useRef(true)
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const handleToggleReasoning = (idx: number) => {
    if (!history[idx]?.reasoning) return
    if (isSubscribed) {
      toggleReasoning(idx)
    } else {
      if (isMountedRef.current) {
        setShowPaywall(true)
      }
    }
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {history.map((item, idx) => (
          <View key={idx} style={styles.bubbleWrapper}>
            <View style={[styles.bubble, styles.userBubble]}>
              <Text style={styles.userText}>{item.question}</Text>
            </View>

            {item.answer ? (
              <>
                <View
                  style={[
                    styles.bubble,
                    styles.aiBubble,
                    expanded.has(idx) && styles.aiBubbleAttached,
                  ]}
                >
                  <Text style={styles.aiText}>{item.answer}</Text>
                  {item.followup && (
                    <>
                      <View style={styles.divider} />
                      <Text style={styles.aiFollowupText}>{item.followup}</Text>
                    </>
                  )}
                </View>

                {expanded.has(idx) && item.reasoning && (
                  <TouchableOpacity
                    activeOpacity={isSubscribed ? 1 : 0.7}
                    onPress={() => {
                      if (!isSubscribed && isMountedRef.current) {
                        setShowPaywall(true)
                      }
                    }}
                    style={[styles.bubble, styles.aiReasoningBubble]}
                  >
                    <Text style={styles.reasoningText}>
                      {isSubscribed ? item.reasoning : 'Upgrade to view reasoning'}
                    </Text>
                  </TouchableOpacity>
                )}

                {item.reasoning && (
                  <TouchableOpacity
                    onPress={() => handleToggleReasoning(idx)}
                    style={styles.reasoningButton}
                  >
                    <Text style={styles.reasoningButtonText}>
                      {expanded.has(idx) ? 'Hide reasoning' : 'Show reasoning'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
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

      <View style={styles.inputBar}>
        <AutoExpandingInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask a follow-up…"
          placeholderTextColor="rgba(95, 95, 95, 1)"
          minHeight={40}
          maxHeight={120}
          style={styles.input}
          editable={!busy}
          returnKeyType="send"
          onSubmitEditing={onSubmit}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={onSubmit}
          disabled={busy}
          style={styles.sendButton}
        >
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Saving conversation modal */}
      <Modal visible={isSaving} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <SpinningLoader size={48} />
        </View>
      </Modal>

      {/* Paywall modal */}
      <Modal visible={showPaywall} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.paywallCard}>
            <Text style={styles.paywallTitle}>Upgrade to view reasoning</Text>
            <Text style={styles.paywallDesc}>
              Unlock detailed reasoning for every AI answer and get deeper insights.
            </Text>
            <TouchableOpacity
              style={styles.paywallButton}
              onPress={() => {
                setShowPaywall(false)
                router.push('/(tabs)/settings/sub')
              }}
            >
              <Text style={styles.paywallButtonText}>Upgrade Now</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPaywall(false)}>
              <Text style={styles.paywallCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightest },
  container: { padding: 20, paddingBottom: 10 },
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
  aiBubbleAttached: {
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 0,
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
    padding: 10,
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
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingTop: 15,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: colors.lighter,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.lightest,
    borderWidth: 1,
    borderColor: colors.lighter,
    fontFamily: 'SpaceMono',
    fontSize: 15,
    color: '#333',
  },
  sendButton: {
    marginLeft: 8,
    padding: 10,
    backgroundColor: colors.blue,
    borderRadius: 10,
    paddingTop: 9,
  },

  // Modal shared styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Saving card
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

  // Paywall card
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
    marginBottom: 12,
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
  },
})
