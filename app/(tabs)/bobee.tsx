// BobeePage.tsx

import React from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
} from 'react-native'
import Header from '~/components/Header'
import useBobee from '~/hooks/useBobee'
import ChatScreen from '~/components/bobee/ChatScreen'
import MainScreen from '~/components/bobee/MainScreen'
import { colors } from '~/constants/Colors'

export default function BobeePage() {
  const {
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
  } = useBobee()

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.lightest} />

      <Header
        title={showChat ? 'Conversation' : 'Bobee'}
        leftIcon={showChat ? 'chevron-back' : undefined}
        onLeftPress={showChat ? () => setShowChat(false) : undefined}
      />

      {showChat ? (
        <ChatScreen
          history={history}
          expanded={expanded}
          toggleReasoning={toggleReasoning}
          scrollRef={scrollRef}
          pulseAnim={pulseAnim}
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          saveConversation={saveConversation}  // ← added
        />
      ) : (
        <MainScreen
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          onSelectConversation={openConversation}
        />
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.lightest,
  },
})
