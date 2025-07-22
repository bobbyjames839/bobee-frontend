import { useState, useRef, useEffect, useCallback } from 'react'
import { Animated, ScrollView } from 'react-native'
import { getAuth } from 'firebase/auth'
import Constants from 'expo-constants';

type HistoryItem = {
  question: string
  answer?: string
  reasoning?: string
  followup?: string
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
  const [showChat, setShowChat] = useState(false)
  const [userFacts, setUserFacts] = useState<string[] | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const scrollRef = useRef<ScrollView>(null)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const prevShowChat = usePrevious(showChat)

  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string;


  useEffect(() => {
    const justClosed = prevShowChat && !showChat

    if (justClosed) {
      if (history.length > 0 && !isLoading) {
        saveConversation()
          .then(() => console.log('Saved conversation on leaving chat'))
          .catch((err) => console.warn('Failed to save conversation:', err))
      }

      // Reset state after save
      setHistory([])
      setExpanded(new Set())
      setConversationId(null)
    }
  }, [showChat])


  // Persist entire history as flat fields: message1, message2, …
  const saveConversation = useCallback(async (): Promise<void> => {
    if (history.length === 0) return
    const uid = getAuth().currentUser?.uid
    if (!uid) return

    // Build transcript client‑side if you like, or let the backend do it
    const transcript = history
      .map(
        (item, i) =>
          `${i + 1}. Q: ${item.question}\n   A: ${item.answer ?? '[no answer]'}`
      )
      .join('\n')

    // Get fresh Firebase ID token
    const idToken = await getAuth().currentUser!.getIdToken(true)

    // Single call: hand off everything to the backend
    const res = await fetch(`${API_BASE}/api/save-conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        conversationId,
        transcript,
        history,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to save conversation')
    }

    const { conversationId: newId } = (await res.json()) as { conversationId: string }
    setConversationId(newId)
  }, [history, conversationId])


  const openConversation = useCallback(async (id: string) => {
    const user = getAuth().currentUser
    if (!user) return

    // get fresh Firebase ID token for auth
    const idToken = await user.getIdToken(true)

    // call your backend instead of Firestore client
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

    // backend returns history[]
    const { history } = (await res.json()) as { history: HistoryItem[] }

    setHistory(history)
    setExpanded(new Set())
    setShowChat(true)
    setConversationId(id)
  }, [setHistory, setExpanded, setShowChat, setConversationId])

  // Pulsating “thinking” animation
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

  // Auto‐scroll when new messages arrive
  useEffect(() => {
    if (showChat) {
      scrollRef.current?.scrollToEnd({ animated: true })
    }
  }, [history, showChat])

  // Load user facts once
  useEffect(() => {
    const user = getAuth().currentUser
    if (!user) return

    ;(async () => {
      try {
        // get fresh token for backend auth
        const idToken = await user.getIdToken(true)

        // call your backend instead of Firestore client
        const res = await fetch(`${API_BASE}/api/load-facts`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })
        if (!res.ok) throw new Error(`Status ${res.status}`)

        const { facts } = (await res.json()) as { facts: string[] | null }
        if (Array.isArray(facts)) {
          setUserFacts(facts)
        }
      } catch (e) {
        console.warn('Failed to load user facts:', e)
      }
    })()
  }, [])


  const toggleReasoning = (idx: number) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      prev.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })

  const handleSubmit = async () => {
    const question = input.trim()
    if (!question) return

    // ——— Grab & assert auth user up front ———
    const user = getAuth().currentUser
    if (!user) return
    const uid = user.uid

    // ——— Push blank question & start loading ———
    setHistory(h => [...h, { question, answer: '' }])
    setShowChat(true)
    setIsLoading(true)
    setInput('')

    try {
      // get fresh token for backend auth
      const idToken = await user.getIdToken(true)

      // call backend to handle everything
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          conversationId,
          question,
          history,
          userFacts,
        }),
      })

      // make sure we got JSON back
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const text = await res.text()
        console.error('Expected JSON, got:', text)
        throw new Error(`Server returned non‑JSON response (status ${res.status})`)
      }

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.error || `Request failed with status ${res.status}`)
      }

      // unpack response
      const { answer, reasoning, followup, conversationId: newId } = payload

      // update the last (blank) entry with the real answer
      setHistory(h => {
        const copy = [...h]
        copy[copy.length - 1] = { question, answer, reasoning, followup }
        return copy
      })

      if (newId) setConversationId(newId)
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
    showChat,
    setShowChat,
    scrollRef,
    pulseAnim,
    toggleReasoning,
    handleSubmit,
    saveConversation,
    openConversation,
  }
}
