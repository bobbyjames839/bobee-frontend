import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StatusBar, StyleSheet } from "react-native";
import Header from "~/components/Header";
import useBobee from "~/hooks/useBobee";
import MainScreen from "~/components/bobee/MainScreen";
import { colors } from "~/constants/Colors";
import { router } from "expo-router";

export default function BobeeMainPage() {
  const [isSaving] = useState(false);
  const { input, setInput, isLoading, handleSubmit } = useBobee();

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.lightest} />
      <Header title="Bobee" />
      <MainScreen
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        onSubmit={() => {
          // Send the first question to the Chat page to submit there
          router.push({
            pathname: "/(tabs)/bobee/chat",
            params: { initialQuestion: input },
          });
        }}
        onSelectConversation={(id) => {
          // Open an existing conversation in the Chat page
          router.push({
            pathname: "/(tabs)/bobee/chat",
            params: { conversationId: id },
          });
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightest },
});
