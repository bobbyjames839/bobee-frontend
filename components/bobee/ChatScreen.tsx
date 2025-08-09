import React, { useContext } from 'react'
import { View, ScrollView, Text, TouchableOpacity, Animated, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
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
  isSaving = false, // NEW: show loading overlay while saving
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

  const busy = isLoading || isSaving // NEW: disable input/send during save

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
                      if (!isSubscribed) {
                        router.push('/settings/sub')
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
                    onPress={() => toggleReasoning(idx)}
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
          minHeight={40}
          maxHeight={120}
          style={styles.input}
          editable={!busy}              // NEW
          returnKeyType="send"
          onSubmitEditing={onSubmit}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={onSubmit}
          disabled={busy}               // NEW
          style={styles.sendButton}
        >
          <Ionicons name="send" size={24} color={colors.blue} />
        </TouchableOpacity>
      </View>

      {isSaving && (                    // NEW overlay
        <View style={styles.savingOverlay}>
          <View style={styles.savingCard}>
            <ActivityIndicator size="large" color={colors.blue} />
            <Text style={styles.savingText}>Saving conversation…</Text>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { 
    flex: 1, 
    backgroundColor: colors.lightest 
  },
  container: { 
    padding: 20, 
    paddingBottom: 10 
  },
  bubbleWrapper: { 
    marginBottom: 20 
  },
  bubble: { 
    borderRadius: 16, 
    padding: 14, 
    maxWidth: '85%' 
  },
  userBubble: {
    backgroundColor: colors.lighter,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.blue,
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
    fontSize: 15 
  },
  aiText: { 
    color: '#fff', 
    fontFamily: 'SpaceMono', 
    fontSize: 15 
  },
  aiFollowupText: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontStyle: 'italic',
    color: '#fff',
    marginTop: 4,
  },
  reasoningText: {
    color: colors.lightest,
    fontSize: 15,
    fontFamily: 'SpaceMono',
  },
  divider: { 
    height: 1, 
    marginVertical: 8 
  },
  reasoningButton: { 
    alignSelf: 'flex-start', 
    marginTop: 4 
  },
  reasoningButtonText: {
    fontFamily: 'SpaceMono',
    fontSize: 13,
    color: colors.blue,
  },
  pulseIcon: { 
    alignSelf: 'flex-start', 
    marginTop: 8 
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    padding: 10,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f1f1',
    fontFamily: 'SpaceMono',
    fontSize: 16,
    color: '#333',
  },
  sendButton: { 
    marginLeft: 8, 
    padding: 8 
  },

  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
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
})
