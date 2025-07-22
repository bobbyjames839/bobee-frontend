// hooks/useJournals.ts
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  increment,
  getDoc,
  Timestamp,
} from 'firebase/firestore'
import { db, auth } from '~/utils/firebase'
import { useJournalRefresh } from '~/context/JournalRefreshContext'
import Constants from 'expo-constants'

export type JournalEntry = {
  id: string
  transcript: string
  createdAt: Timestamp
  prompt?: string
  aiResponse: {
    summary: string
    moodScore: number
    nextStep: string
    feelings: string[]
    topic: string
    thoughtPattern: string
    selfInsight: string
  }
}

export default function useJournals() {
  const { refreshKey, triggerRefresh } = useJournalRefresh()
  const [journals, setJournals] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null)

  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string

  // —— REWRITTEN fetchJournals — hits your backend, then converts ISO → Timestamp
  const fetchJournals = useCallback(async () => {
    const user = auth.currentUser
    if (!user) return

    setLoading(true)
    try {
      const idToken = await user.getIdToken(true)
      const res = await fetch(`${API_BASE}/api/fetch-journals`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      })
      if (!res.ok) {
        throw new Error(`Server error: ${res.statusText}`)
      }
      
      // backend returns createdAt as ISO string
      const raw: Array<Omit<JournalEntry, 'createdAt'> & { createdAt: string }> =
        await res.json()

      // convert back to Timestamp so the rest of your code is unchanged
      const entries = raw.map((e) => ({
        ...e,
        createdAt: Timestamp.fromDate(new Date(e.createdAt)),
      }))

      setJournals(entries)
    } catch (err) {
      console.error('Failed to fetch journals:', err)
      setJournals([])
    } finally {
      setLoading(false)
    }
  }, [API_BASE])

  const openModal = (entry: JournalEntry) => {
    setSelectedJournal(entry)
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setSelectedJournal(null)
  }

  const handleDelete = async () => {
    if (!selectedJournal) return;
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const idToken = await user.getIdToken(/* forceRefresh */ true);
      const res = await fetch(
        `${API_BASE}/api/delete-journal/${selectedJournal.id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      if (!res.ok) {
        throw new Error(`Server error: ${res.statusText}`);
      }

      closeModal();
      await fetchJournals();
      triggerRefresh();
    } catch (err) {
      console.error('Error deleting journal:', err);
    } finally {
      setLoading(false);
    }
  };


  // fetch on mount & on refreshKey
  useEffect(() => {
    fetchJournals()
  }, [fetchJournals, refreshKey])

  const recentThree = useMemo(() => journals.slice(0, 3), [journals])

  return {
    journals,
    loading,
    modalVisible,
    selectedJournal,
    openModal,
    closeModal,
    handleDelete,
    recentThree,
  }
}
