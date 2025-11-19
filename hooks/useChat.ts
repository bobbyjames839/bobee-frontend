import { useState, useRef, useEffect, useCallback, use } from 'react'
import { Animated, ScrollView } from 'react-native'
import { getAuth } from 'firebase/auth'
import Constants from 'expo-constants';
import { auth } from '~/utils/firebase';

type HistoryItem = {
  question: string
  answer?: string
}

type Conversation = {
  id: string
  title: string
  createdAt: string
  updatedAt?: string
}

export default function useBobee() {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string
  const [aiPersonality, setAiPersonality] = useState<{ style: string; creativity: number } | null>(null);
  const [showSidebar, setShowSidebar] = useState(false)
  const sidebarAnim = useRef(new Animated.Value(0)).current
  const [convos, setConvos] = useState<Conversation[]>([])
  const [convosLoading, setConvosLoading] = useState(false)
  const [convosError, setConvosError] = useState<string | null>(null)
  const scrollRef = useRef<ScrollView>(null)
  const pulseAnim = useRef(new Animated.Value(1)).current


  const fetchAiPersonality = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/api/get-ai-personality`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const personality = data.AIPersonality || data.aiPersonality;
      setAiPersonality(personality || { style: 'friendly', creativity: 70 });
      console.log('[useChat] AI Personality fetched:', personality);
    } catch (err) {
      console.error('Failed fetching AI Personality:', err);
      setAiPersonality({ style: 'friendly', creativity: 70 });
    }
  }


  const fetchConvos = async () => {
    try {
      const user = getAuth().currentUser
      if (!user) return
      setConvosError(null)
      const idToken = await user.getIdToken(true)
      const res = await fetch(`${API_BASE}/api/list-conversations`, {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        console.warn('list-conversations failed', res.status, text)
        throw new Error(`HTTP ${res.status} ${text || ''}`.trim())
      }
      const data = await res.json()
      if (Array.isArray(data.conversations)) {
        setConvos(data.conversations)
      } else {
        setConvos([])
      }
    } catch (e: any) {
      setConvosError(e?.message || 'Failed to load')
    }
  }

  useEffect(() => {
    fetchConvos()
    fetchAiPersonality()
  }, [])



  const toggleSidebar = useCallback(() => {
    const to = showSidebar ? 0 : 1
    setShowSidebar(!showSidebar)
    Animated.timing(sidebarAnim, {
      toValue: to,
      duration: 220,
      useNativeDriver: true,
    }).start()
  }, [showSidebar, sidebarAnim])



  const generateConversationTitle = useCallback(async (
    conversationId: string,
    question: string,
    answer: string,
    idToken: string
  ) => {
    try {
      const res = await fetch(`${API_BASE}/api/generate-conversation-title`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          conversationId,
          question,
          answer,
        }),
      })

      if (!res.ok) {
        throw new Error(`Failed to generate title: ${res.status}`)
      }

      const { title } = await res.json()
      
      // Add the new conversation to the sidebar list
      setConvos(prev => [{
        id: conversationId,
        title,
        createdAt: Date.now().toString(),
        updatedAt: Date.now().toString(),
      }, ...prev])

      console.log(`Title generated and added to sidebar: "${title}"`)
    } catch (error) {
      console.error('Error generating conversation title:', error)
    }
  }, [API_BASE])


  const updateAiPersonality = async (personality: { style: string; creativity: number }) => {
    const user = auth.currentUser;
    if (!user) return;

    setAiPersonality(personality);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/api/update-ai-personality`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(personality),
      });
      if (!res.ok) {
        throw new Error('Failed to update personality');
      }
      console.log('[useChat] AI Personality updated:', personality);
    } catch (err) {
      console.error('Failed updating AI Personality:', err);
    }
  }


  const deleteConversation = async (idToDelete?: string) => {
    const targetId = idToDelete || conversationId;
    if (!targetId) return;
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
        setConversationId(null);
        setShowChat(false);
      }
      setConvos(prev => prev.filter(c => c.id !== targetId));
    } catch (e) {
      console.warn('Delete failed:', e);
    } finally {
    }
  }


  
  const openConversation = async (id: string) => {
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
    setShowChat(true)
    setConversationId(id)
  }




  const handleNewChat = () => {
    setHistory([])
    setConversationId(null)
    setInput('')
  }



  useEffect(() => {
    if (isLoading) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
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

      const requestBody: Record<string, any> = {
        question,
        history,
        aiPersonality
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

      // Set conversationId if it's the first message
      const isFirstMessage = !conversationId && newId
      if (isFirstMessage) {
        setConversationId(newId)
        
        // Generate title in background and add to sidebar
        generateConversationTitle(newId, question, answer, idToken).catch(err => {
          console.error('Failed to generate title:', err)
        })
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
    isLoading,
    showChat,
    setShowChat,
    scrollRef,
    pulseAnim,
    handleSubmit,
    openConversation,
    deleteConversation,
    handleNewChat,
    conversationId,
    aiPersonality,
    setAiPersonality,
    fetchAiPersonality,
    updateAiPersonality,
    // Sidebar
    showSidebar,
    toggleSidebar,
    sidebarAnim,
    convos,
    convosLoading,
    convosError,
  }
}
