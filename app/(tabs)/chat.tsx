import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
} from "react-native";
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import useBobee from "~/hooks/useChat";
import ChatScreen from "~/components/chat/ChatScreen";
import ChatSidebar from "~/components/chat/ChatSidebar";
import { colors } from "~/constants/Colors";
import TutorialOverlay from "~/components/other/TutorialOverlay";
import { navigate } from "expo-router/build/global-state/routing";
import { FilePen, TextAlignStart, ChevronUp } from "lucide-react-native";
import { useTabBar } from "~/context/TabBarContext";



export default function BobeeChatPage() {
  const { isTabBarVisible, showTabBar, hideTabBar } = useTabBar();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const {
    input,
    setInput,
    history,
    isLoading,
    scrollRef,
    pulseAnim,
    handleSubmit,
    openConversation,
    deleteConversation,
    handleNewChat,
    aiPersonality,
    updateAiPersonality,
    conversationId: currentConversationId,
    // Sidebar
    showSidebar,
    toggleSidebar,
    sidebarAnim,
    convos,
    convosLoading,
    convosError,
  } = useBobee();

  const toggleSidebarWithHaptics = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    toggleSidebar();
  }, [toggleSidebar]);

  const { conversationId, initialQuestion } = useLocalSearchParams<{
    conversationId?: string;
    initialQuestion?: string;
  }>();

  const [pendingInitial, setPendingInitial] = useState<string | null>(null);

  useEffect(() => {
    if (conversationId && typeof conversationId === "string") {
      openConversation(conversationId);
      return;
    }
    const q =
      typeof initialQuestion === "string" ? initialQuestion.trim() : "";
    if (q) {
      setPendingInitial(q);
      setInput(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pendingInitial && input === pendingInitial) {
      handleSubmit();
      setPendingInitial(null);
    }
  }, [input, pendingInitial, handleSubmit]);

  const { tour } = useLocalSearchParams<{ tour?: string }>();
  const [showTutorial, setShowTutorial] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);

      hideTabBar();

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, [fadeAnim, slideAnim, hideTabBar])
  );

  useEffect(() => {
    setShowTutorial(tour === "5");
  }, [tour]);

  return (
    <>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 40}
      >
        <StatusBar barStyle="dark-content" backgroundColor={colors.lightest} />

        <Animated.View
          style={{
            flex: 1,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={styles.headerContainer}>
            <TouchableOpacity
              onPress={toggleSidebarWithHaptics}
              style={styles.headerButton}
            >
              <TextAlignStart size={22} color={colors.darkest} strokeWidth={2} />
            </TouchableOpacity>
            <Text
              style={{
                fontFamily: "SpaceMonoSemibold",
                fontSize: 18,
                color: colors.darkest,
              }}
            >
              Bobee
            </Text>
            <TouchableOpacity
              onPress={handleNewChat}
              style={styles.headerButton}
            >
              <FilePen size={22} color={colors.darkest} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ChatSidebar
            sidebarAnim={sidebarAnim}
            convos={convos}
            convosLoading={convosLoading}
            convosError={convosError}
            onSelect={(id) => openConversation(id)}
            close={() => toggleSidebar()}
            onDelete={deleteConversation}
            currentConversationId={currentConversationId}
            aiPersonality={aiPersonality}
            updateAiPersonality={updateAiPersonality}
          />

          <ChatScreen
            history={history}
            scrollRef={scrollRef}
            pulseAnim={pulseAnim}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            isTabBarVisible={isTabBarVisible}
            hideTabBar={hideTabBar}
            showTabBar={showTabBar}
          />
        </Animated.View>

        {showTutorial && (
          <TutorialOverlay
            step={5}
            total={5}
            title="Chat with Bobee"
            description="Ask questions, get coaching, or brainstorm. Bobee learns from your journaling to tailor responses."
            nextLabel="Finish"
            onNext={() => {
              setShowTutorial(false);
              navigate("/journal");
              showTabBar();
            }}
            onSkip={() => setShowTutorial(false)}
          />
        )}
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.lightest,
  },
  headerContainer: {
    position: "relative",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  headerButton: {
    height: 42,
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
  },
});
