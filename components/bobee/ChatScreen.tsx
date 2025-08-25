// ChatScreen.tsx
import React, {
  useContext,
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
  Modal,
  Keyboard,
  Platform,
  EmitterSubscription,
} from 'react-native'
import SpinningLoader from '~/components/other/SpinningLoader'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useRouter, useFocusEffect } from 'expo-router'
import { useIsFocused } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AutoExpandingInput from './AutoExpandingInput'
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
  isDeleting,
  onDelete,
  onSaveAndBack,
}: {
  history: ChatHistoryItem[]
  expanded: Set<number>
  toggleReasoning: (i: number) => void
  scrollRef: React.RefObject<ScrollView | null>
  pulseAnim: Animated.Value
  input: string
  setInput: (s: string) => void
  isLoading: boolean
  isDeleting?: boolean
  onDelete?: () => void
  onSubmit: () => void
  isSaving?: boolean
  onSaveAndBack?: () => void
}) {
  const { isSubscribed } = useContext(SubscriptionContext)
  const router = useRouter()
  const [showPaywall, setShowPaywall] = useState(false)
  const busy = isLoading || isSaving
  const isFocused = useIsFocused()

  // Keyboard + safe-area handling
  const insets = useSafeAreaInsets()
  const [kbVisible, setKbVisible] = useState(false)

  // Only track keyboard visibility for bottom padding
  const [kbHeight, setKbHeight] = useState(0)

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
  const buttonsBottomPad = kbVisible ? 10 : Math.max(insets.bottom, 12)

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

  // Close paywall whenever saving starts
  useEffect(() => {
    if (isSaving) setShowPaywall(false)
  }, [isSaving])

  const handleToggleReasoning = (idx: number) => {
    if (isSaving) return
    if (!history[idx]?.reasoning) return
    if (isSubscribed) {
      toggleReasoning(idx)
    } else {
      if (isMountedRef.current) setShowPaywall(true)
    }
  }

  // Two-tap delete (bin -> check -> spinner), same UX as MainScreen
  const [pendingDelete, setPendingDelete] = useState(false)
  useFocusEffect(
    useCallback(() => {
      setPendingDelete(false)
      return () => setPendingDelete(false)
    }, [])
  )

  return (
    <View style={styles.flex}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: 120 + kbHeight }, // keep last bubble visible when keyboard is open
        ]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={false} // Disable automatic adjustment as we're manually handling it
        keyboardDismissMode="interactive" // Better dismiss behavior when dragging
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
                      if (!isSubscribed && isMountedRef.current) setShowPaywall(true)
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

      {/* Footer pinned to bottom: input above buttons */}
      <View style={styles.footer}>
        <View style={styles.inputContainer}>
          <AutoExpandingInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything"
            placeholderTextColor="rgba(107, 107, 107, 1)"
            minHeight={25}
            maxHeight={120}
            style={styles.input}
            editable={!busy}
            returnKeyType="send"
            onSubmitEditing={onSubmit}
            blurOnSubmit={false}
          />
        </View>

        <View style={[styles.buttonsRow, { paddingBottom: buttonsBottomPad }]}>
          <View style={styles.leftButtons}>
            <TouchableOpacity
              onPress={onSaveAndBack}
              style={styles.saveButton}
              disabled={isSaving}
            >
              {isSaving ? (
                <SpinningLoader size={20} thickness={3} color="green" />
              ) : (
                <MaterialIcons name="save-alt" size={20} color="green" />
              )}
            </TouchableOpacity>

            {/* Delete: first tap arms (bin -> check). Second tap confirms and shows spinner. */}
            <TouchableOpacity
              onPress={async () => {
                if (!onDelete || isDeleting) return
                if (pendingDelete) {
                  await onDelete()
                  router.back()
                } else {
                  setPendingDelete(true)
                }
              }}
              style={styles.deleteButton}
              disabled={!!isDeleting}
            >
              {isDeleting ? (
                <SpinningLoader size={20} thickness={3} color="rgba(119, 10, 10, 1)" />
              ) : (
                <MaterialIcons
                  name={pendingDelete ? 'check' : 'delete-outline'}
                  size={20}
                  color="rgba(119, 10, 10, 1)"
                />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onSubmit} disabled={busy} style={styles.sendButton}>
            <Ionicons name="arrow-up" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Paywall modal */}
      {showPaywall && isFocused && !isSaving ? (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.paywallCard}>
              <Text style={styles.paywallTitle}>Upgrade to view reasoning</Text>
              <Text style={styles.paywallDesc}>
                Unlock detailed reasoning for every AI answer and get deeper insights.
              </Text>
              <TouchableOpacity
                style={styles.paywallButton}
                onPress={() => {
                  router.push('/settings/sub')
                  setShowPaywall(false)
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
      ) : null}
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
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    elevation: 10,
    backgroundColor: colors.lightest,
  },

  inputContainer: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: 'white',
    paddingHorizontal: 18,
    paddingTop: 8,
    borderWidth: 1,
    borderColor: colors.lighter,
    borderBottomWidth: 0,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingBottom: 30, // overridden dynamically at runtime
    paddingTop: 12,
  },
  leftButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  saveButton: {
    padding: 7,
    backgroundColor: colors.green,
    borderRadius: 500,
  },
  deleteButton: {
    padding: 7,
    backgroundColor: 'rgba(233, 127, 127, 1)',
    borderRadius: 500,
  },

  input: {
    flex: 1,
    fontFamily: 'SpaceMono',
    fontSize: 15,
    letterSpacing: 0.3,
    lineHeight: 22,
    color: '#333',
  },
  sendButton: {
    marginLeft: 8,
    padding: 7,
    backgroundColor: colors.blue,
    borderRadius: 500,
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
