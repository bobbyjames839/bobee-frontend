import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react'
import {
  View,
  ScrollView,
  Animated,
  StyleSheet,
  Keyboard,
  Platform,
  EmitterSubscription,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ChatMessages from './ChatMessages'
import ChatFooter from './ChatFooter'
import { colors } from '~/constants/Colors'

type ChatHistoryItem = {
  question: string
  answer?: string
}

export default function ChatScreen({
  history,
  scrollRef,
  pulseAnim,
  input,
  setInput,
  isLoading,
  onSubmit,
  isTabBarVisible = false,
}: {
  history: ChatHistoryItem[]
  scrollRef: React.RefObject<ScrollView | null>
  pulseAnim: Animated.Value
  input: string
  setInput: (s: string) => void
  isLoading: boolean
  onSubmit: () => void
  isTabBarVisible?: boolean
}) {
  const busy = isLoading
  const insets = useSafeAreaInsets()
  const [kbVisible, setKbVisible] = useState(false)
  const [kbHeight, setKbHeight] = useState(0)
  const [inputLineCount, setInputLineCount] = useState(1)
  const showSuggestions = history.length === 0 && input.trim().length === 0
  const footerHeight = showSuggestions ? 200 : 120
  const footerBottomAnim = useRef(new Animated.Value(0)).current
  
  // Animate footer bottom position when tab bar visibility changes
  useEffect(() => {
    Animated.timing(footerBottomAnim, {
      toValue: isTabBarVisible ? 70 : 0,
      duration: isTabBarVisible ? 350 : 250,
      useNativeDriver: false,
    }).start();
  }, [isTabBarVisible, footerBottomAnim]);

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
  const buttonsBottomPad = kbVisible ? 10 : 25

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



  return (
    <View style={styles.flex}>
      <ChatMessages
        history={history}
        scrollRef={scrollRef}
        pulseAnim={pulseAnim}
        isLoading={isLoading}
        footerHeight={footerHeight}
        kbHeight={kbHeight}
      />

      <ChatFooter
        input={input}
        setInput={setInput}
        isLoading={busy}
        onSubmit={onSubmit}
        showSuggestions={showSuggestions}
        buttonsBottomPad={buttonsBottomPad}
        footerBottomAnim={footerBottomAnim}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightest },
})
