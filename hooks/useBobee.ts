import { useState, useRef, useEffect, useCallback, use } from 'react'
import { Animated, ScrollView } from 'react-native'
import { getAuth } from 'firebase/auth'
import Constants from 'expo-constants';

type HistoryItem = {
  question: string
  answer?: string
}

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref.current
}

export default function useBobee() {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showChat, setShowChat] = useState(false)
  // userProfile removed – no longer fetched or sent
  const [conversationId, setConversationId] = useState<string | null>(null)
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string
  const deleteConversation = useCallback(async (idToDelete?: string) => {
    const targetId = idToDelete || conversationId;
    if (!targetId) return;
    setIsDeleting(true);
    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error('No user');
      const idToken = await user.getIdToken(true);
      const res = await fetch(`${API_BASE}/api/delete-conversation/${targetId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (!res.ok) throw new Error('Failed to delete');
      // Only clear the UI if deleting the current conversation
      if (targetId === conversationId) {
        setHistory([]);
        setExpanded(new Set());
        setConversationId(null);
        setShowChat(false);
      }
    } catch (e) {
      console.warn('Delete failed:', e);
    } finally {
      setIsDeleting(false);
    }
  }, [conversationId, API_BASE]);

  const scrollRef = useRef<ScrollView>(null)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const prevShowChat = usePrevious(showChat)


  useEffect(() => {
    const justClosed = prevShowChat && !showChat

    if (justClosed) {
      // only auto-save if we didn’t explicitly trigger a save (e.g., user swiped back, app killed, etc.)
      if (!didExplicitSaveRef.current && history.length > 0 && !isLoading) {
        saveConversation()
          .then(() => console.log('Saved conversation on leaving chat (fallback)'))
          .catch((err) => console.warn('Failed to save conversation:', err))
      }
      setHistory([])
      setExpanded(new Set())
      setConversationId(null)

      didExplicitSaveRef.current = false
    }
  }, [showChat])

  const didExplicitSaveRef = useRef(false)

  const saveConversation = useCallback(async (): Promise<void> => {
    if (history.length === 0) return
    const uid = getAuth().currentUser?.uid
    if (!uid) return

    didExplicitSaveRef.current = true 

    const transcript = history
      .map((item, i) => `${i + 1}. Q: ${item.question}\n   A: ${item.answer ?? '[no answer]'}`)
      .join('\n')

    const idToken = await getAuth().currentUser!.getIdToken(true)

    const res = await fetch(`${API_BASE}/api/save-conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ conversationId, transcript, history }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      didExplicitSaveRef.current = false // reset on error
      throw new Error(err.message || 'Failed to save conversation')
    }

    const { conversationId: newId } = (await res.json()) as { conversationId: string }
    setConversationId(newId)

  }, [history, conversationId])


  const openConversation = useCallback(async (id: string) => {
    const user = getAuth().currentUser
    if (!user) return

    const idToken = await user.getIdToken(true)

    const res = await fetch(`${API_BASE}/api/open-conversation/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    })
    if (!res.ok) {
      console.error('Failed to load conversation', await res.text())
      return
    }

    const { history } = (await res.json()) as { history: HistoryItem[] }

    setHistory(history)
    setExpanded(new Set())
    setShowChat(true)
    setConversationId(id)
  }, [setHistory, setExpanded, setShowChat, setConversationId, API_BASE])

  const newConversation = useCallback(() => {
    setHistory([])
    setExpanded(new Set())
    setConversationId(null)
    setInput('')
  }, [])



  useEffect(() => {
    if (isLoading) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      )
      loop.start()
      return () => loop.stop()
    }
    pulseAnim.setValue(1)
  }, [isLoading, pulseAnim])


  
  useEffect(() => {
    if (showChat) {
      scrollRef.current?.scrollToEnd({ animated: true })
    }
  }, [history, showChat])


  
  // Removed effect that fetched userProfile


  const toggleReasoning = (idx: number) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      prev.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })

  const handleSubmit = async () => {
    const question = input.trim()
    if (!question) return

    const user = getAuth().currentUser
    if (!user) return

    setHistory(h => [...h, { question, answer: '' }])
    setShowChat(true)
    setIsLoading(true)
    setInput('')

    try {
      const idToken = await user.getIdToken(true)

      // Only send conversationId if it exists (prevents false "existing chat" on first message)
      const requestBody: Record<string, any> = {
        question,
        history,
      }
      if (conversationId) {
        requestBody.conversationId = conversationId
      }

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(requestBody),
      })

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const text = await res.text()
        console.error('Expected JSON, got:', text)
        throw new Error(`Server returned non-JSON response (status ${res.status})`)
      }

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.error || `Request failed with status ${res.status}`)
      }

  const { answer, conversationId: newId } = payload

      setHistory(h => {
        const copy = [...h]
  copy[copy.length - 1] = { question, answer }
        return copy
      })

      // Set conversationId if it’s the first message
      if (!conversationId && newId) {
        setConversationId(newId)
      }
    } catch (err) {
      console.error(err)
      setHistory(h => {
        const copy = [...h]
        copy[copy.length - 1].answer = 'Oops, something went wrong.'
        return copy
      })
    } finally {
      setIsLoading(false)
    }
  }


  return {
    input,
    setInput,
    history,
    expanded,
    isLoading,
    isDeleting,
    showChat,
    setShowChat,
    scrollRef,
    pulseAnim,
    toggleReasoning,
    handleSubmit,
    saveConversation,
    openConversation,
    deleteConversation,
    newConversation,
    conversationId,
  }
}
