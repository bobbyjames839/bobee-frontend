import React, { useState, useEffect, useContext } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { BlurView } from 'expo-blur'
import AutoExpandingInput from './AutoExpandingInput'
import QuotaBar from './QuotaBar'
import { SubscriptionContext } from '~/context/SubscriptionContext'
import { colors } from '~/constants/Colors'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'

type ConversationSummary = {
  id: string
  title: string
  createdAt: Date
}

const API_BASE = Constants.expoConfig?.extra?.backendUrl as string

export default function MainScreen({
  input,
  setInput,
  isLoading,
  onSubmit,
  onSelectConversation,
}: {
  input: string
  setInput: (s: string) => void
  isLoading: boolean
  onSubmit: () => void
  onSelectConversation: (id: string) => void
}) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [todayCount, setTodayCount] = useState<number>(0)
  const { isSubscribed } = useContext(SubscriptionContext)
  const limit = isSubscribed ? 50 : 5
  const reachedLimit = todayCount >= limit
  const router = useRouter()

  const getAuthHeaders = async () => {
    const user = getAuth().currentUser
    if (!user) throw new Error('Not signed in')
    const token = await user.getIdToken()
    return { Authorization: `Bearer ${token}` }
  }

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setConversations([])
        setTodayCount(0)
        return
      }

      try {
        const token = await user.getIdToken()
        const res = await fetch(`${API_BASE}/api/conversations-and-daily-count`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = await res.json()

        setConversations(
          (json.conversations || []).map((c: any) => ({
            id: c.id,
            title: c.title,
            createdAt: new Date(c.createdAt),
          }))
        )
        setTodayCount(json.todayCount ?? 0)
      } catch (e: any) {
        console.warn('Error loading conversations overview', e)
        setTodayCount(0)
      }
    })

    return () => unsubscribe()
  }, [isSubscribed])

  const handleDelete = async (id: string) => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${API_BASE}/api/delete-conversation/${id}`, {
        method: 'DELETE',
        headers,
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Delete failed')
      setConversations((cs) => cs.filter((c) => c.id !== id))
    } catch (e: any) {
      console.warn('Delete error', e)
      Alert.alert('Error', e.message)
    }
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <QuotaBar todayCount={todayCount} isSubscribed={!!isSubscribed} />

        <Text style={styles.pageTitle}>Ask Bobee Anything</Text>
        <View style={styles.inputWrapper}>
          {reachedLimit && <BlurView intensity={12} tint="light" style={styles.overlay} />}

          <AutoExpandingInput
            value={input}
            onChangeText={setInput}
            placeholder="What’s on your mind?"
            placeholderTextColor={colors.light}
            minHeight={140}
            maxHeight={300}
            style={styles.bigInput}
            editable={!isLoading && !reachedLimit}
          />

          <TouchableOpacity
            style={[styles.submitButton, (isLoading || reachedLimit) && styles.disabledButton]}
            onPress={onSubmit}
            disabled={isLoading || reachedLimit}
          >
            <Text style={styles.submitText}>{isLoading ? 'Thinking…' : 'Ask Bobee'}</Text>
          </TouchableOpacity>

          {reachedLimit && (
            <View style={styles.limitBannerOverlay}>
              <Text style={styles.limitTextOverlay}>
                {isSubscribed
                  ? "You've reached your 50 conversations for today. Please come back tomorrow."
                  : "You've reached your 5 free conversations. Upgrade for more!"}
              </Text>
              {!isSubscribed && (
                <TouchableOpacity
                  style={styles.upgradeOverlayButton}
                  onPress={() => router.push('/(tabs)/settings/sub')}
                >
                  <Text style={styles.upgradeOverlayText}>Upgrade Plan</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Recent Conversations section is always visible */}
        <Text style={styles.sectionTitle}>Recent Conversations</Text>

        {conversations.length > 0 ? (
          conversations.map((conv) => (
            <View key={conv.id} style={styles.conversationItem}>
              {pendingDelete === conv.id ? (
                <View style={styles.confirmContainer}>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => {
                      handleDelete(conv.id)
                      setPendingDelete(null)
                    }}
                  >
                    <Text style={styles.confirmText}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setPendingDelete(null)}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.conversationContent}
                    onPress={() => onSelectConversation(conv.id)}
                  >
                    <Text style={styles.conversationTitle}>{conv.title}</Text>
                    <Text style={styles.conversationDate}>
                      {conv.createdAt.toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => setPendingDelete(conv.id)}
                  >
                    <Ionicons name="trash" size={20} color="red" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ))
        ) : (
          <View style={styles.conversationItem}>
            <View style={styles.conversationContent}>
              <Text style={styles.conversationTitle}>You currently have no conversations</Text>
              <Text style={styles.conversationDate}>
                Start a new one above to see it here
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.lightest,
  },
  container: {
    padding: 20,
    paddingBottom: 10,
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: 'SpaceMono',
    color: colors.darkest,
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bigInput: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    fontSize: 14,
    fontFamily: 'SpaceMono',
    color: '#333',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.lighter,
  },
  submitButton: {
    backgroundColor: colors.blue,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  limitBannerOverlay: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 2,
  },
  limitTextOverlay: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: colors.darkest,
    textAlign: 'center',
    marginBottom: 8,
  },
  upgradeOverlayButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeOverlayText: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'SpaceMono',
    color: colors.darkest,
    marginTop: 20,
    marginBottom: 12,
  },
  conversationItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.lighter,
    borderRadius: 8,
    height: 100,
    marginBottom: 8,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 12,
  },
  conversationTitle: {
    fontSize: 16,
    fontFamily: 'SpaceMono',
    color: colors.darkest,
  },
  conversationDate: {
    fontSize: 12,
    fontFamily: 'SpaceMono',
    color: colors.light,
    marginTop: 4,
  },
  deleteButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -10,
    padding: 4,
  },
  confirmContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
  },
  confirmButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#bdc3c7',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  confirmText: {
    fontFamily: 'SpaceMono',
    color: '#fff',
    fontSize: 14,
  },
  cancelText: {
    fontFamily: 'SpaceMono',
    color: '#fff',
    fontSize: 14,
  },
})
