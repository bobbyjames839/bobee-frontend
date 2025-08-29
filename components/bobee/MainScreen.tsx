import React, { useState, useEffect, useContext, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { BlurView } from 'expo-blur'
import { useFocusEffect } from '@react-navigation/native' // or from 'expo-router' if you prefer
import { MaterialIcons } from '@expo/vector-icons'
import AutoExpandingInput from './AutoExpandingInput'
import QuotaBar from './QuotaBar'
import SpinningLoader from '~/components/other/SpinningLoader'
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
const DELETE_RED = '#bd1212ff'

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
  const [pendingDelete, setPendingDelete] = useState<string | null>(null) // same pattern as JournalCard (armed id)
  const [deletingId, setDeletingId] = useState<string | null>(null)       // id currently deleting (show spinner)
  const [todayCount, setTodayCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
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

  // Reset confirm + spinner whenever screen gains focus (and on blur), like JournalCard's useFocusEffect.
  useFocusEffect(
    useCallback(() => {
      setPendingDelete(null)
      setDeletingId(null)
      return () => {
        setPendingDelete(null)
        setDeletingId(null)
      }
    }, [])
  )

  // Fetch conversations (used on mount and on focus)
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    const user = getAuth().currentUser;
    if (!user) {
      setConversations([]);
      setTodayCount(0);
      setLoading(false);
      return;
    }
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/api/conversations-and-daily-count`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setConversations(
        (json.conversations || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          createdAt: new Date(c.createdAt),
        }))
      );
      setTodayCount(json.todayCount ?? 0);
    } catch (e: any) {
      console.warn('Error loading conversations overview', e);
      setTodayCount(0);
    } finally {
      setLoading(false);
    }
  }, [isSubscribed]);

  // Fetch on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch on focus
  useFocusEffect(
    useCallback(() => {
      fetchConversations();
      setPendingDelete(null);
      setDeletingId(null);
      return () => {
        setPendingDelete(null);
        setDeletingId(null);
      };
    }, [fetchConversations])
  );

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
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
    } finally {
      setDeletingId(null)
      setPendingDelete(null)
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
                  onPress={() => router.push('/settings/sub')}
                >
                  <Text style={styles.upgradeOverlayText}>Upgrade Plan</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Recent Conversations</Text>

        {loading ? (
          <View style={{ alignItems: 'center', marginVertical: 24 }}>
            <SpinningLoader size={40} />
          </View>
        ) : conversations.length > 0 ? (
          conversations.map((conv) => (
            <View key={conv.id} style={styles.conversationItem}>
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
                onPress={() => {
                  if (deletingId) return
                  if (pendingDelete === conv.id) {
                    // second tap confirms
                    handleDelete(conv.id)
                  } else {
                    // first tap arms (bin -> check)
                    setPendingDelete(conv.id)
                  }
                }}
                style={styles.deleteButton}
              >
                {deletingId === conv.id ? (
                  <SpinningLoader size={20} thickness={3} color={DELETE_RED} />
                ) : (
                  <MaterialIcons
                    name={pendingDelete === conv.id ? 'check' : 'delete-outline'}
                    size={30}
                    color={DELETE_RED}
                  />
                )}
              </TouchableOpacity>
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
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    fontFamily: 'SpaceMono',
    color: '#333',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.lighter,
  },
  submitButton: {
    backgroundColor: colors.blue,
    paddingVertical: 14,
    borderRadius: 16,
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
    borderRadius: 16,
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
    borderRadius: 10,
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
    borderRadius: 16,
    height: 80,
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
    fontSize: 14,
    fontFamily: 'SpaceMono',
    color: colors.dark,
    marginTop: 4,
  },
  deleteButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: '-50%' }],
    padding: 4,
    borderRadius: 20,
  },
})
