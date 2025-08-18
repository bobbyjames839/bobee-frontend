import React, { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StatusBar, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Header from "~/components/other/Header";
import useBobee from "~/hooks/useBobee";
import ChatScreen from "~/components/bobee/ChatScreen";
import { colors } from "~/constants/Colors";

export default function BobeeChatPage() {
  const [isSaving, setIsSaving] = useState(false);
  const {
    input, setInput, history, expanded, isLoading, isDeleting,
    scrollRef, pulseAnim, toggleReasoning, handleSubmit, saveConversation, openConversation, deleteConversation,
  } = useBobee();

  const { conversationId, initialQuestion } = useLocalSearchParams<{
    conversationId?: string;
    initialQuestion?: string;
  }>();

  // On first mount: either open an existing conversation or start a new one
  const [pendingInitial, setPendingInitial] = useState<string | null>(null);
  useEffect(() => {
    // Open existing conversation
    if (conversationId && typeof conversationId === "string") {
      openConversation(conversationId);
      return;
    }
    // Start new conversation with an initial question (if provided)
    const q = typeof initialQuestion === "string" ? initialQuestion.trim() : "";
    if (q) {
      setPendingInitial(q);
      setInput(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trigger handleSubmit only after input is set
  useEffect(() => {
    if (pendingInitial && input === pendingInitial) {
      handleSubmit();
      setPendingInitial(null);
    }
  }, [input, pendingInitial, handleSubmit]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.lightest} />
      <Header
        title="Conversation"
      />
      <ChatScreen
        history={history}
        expanded={expanded}
        toggleReasoning={toggleReasoning}
        scrollRef={scrollRef}
        pulseAnim={pulseAnim}
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        isDeleting={isDeleting}
        onDelete={deleteConversation}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        onSaveAndBack={async () => {
          if (isSaving) return;
          try {
            setIsSaving(true);
            await saveConversation();
          } catch (e) {
            console.warn("saveConversation failed", e);
          } finally {
            router.back();
            setTimeout(() => {
              setIsSaving(false);
            }, 1000);
          }
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightest },
});
