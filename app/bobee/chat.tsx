import React, { useEffect, useState, useCallback } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Header from "~/components/other/Header";
import useBobee from "~/hooks/useBobee";
import ChatScreen from "~/components/bobee/ChatScreen";
import SpinningLoader from "~/components/other/SpinningLoader";
import { colors } from "~/constants/Colors";
import { getAuth } from "firebase/auth";
import Constants from "expo-constants";
import TutorialOverlay from "~/components/other/TutorialOverlay";

export default function BobeeChatPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarAnim = useState(new Animated.Value(0))[0];
  const [convos, setConvos] = useState<
    { id: string; title: string; createdAt: string; updatedAt?: string }[]
  >([]);
  const [convosLoading, setConvosLoading] = useState(false);
  const [convosError, setConvosError] = useState<string | null>(null);
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string;

  const toggleSidebar = useCallback(() => {
    const to = showSidebar ? 0 : 1;
    setShowSidebar(!showSidebar);
    Animated.timing(sidebarAnim, {
      toValue: to,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [showSidebar, sidebarAnim]);

  const fetchConvos = useCallback(async () => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;
      setConvosLoading(true);
      setConvosError(null);
      const idToken = await user.getIdToken(true);
      const res = await fetch(`${API_BASE}/api/list-conversations`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn("list-conversations failed", res.status, text);
        throw new Error(`HTTP ${res.status} ${text || ""}`.trim());
      }
      const data = await res.json();
      if (Array.isArray(data.conversations)) {
        setConvos(data.conversations);
      } else {
        setConvos([]);
      }
    } catch (e: any) {
      setConvosError(e?.message || "Failed to load");
    } finally {
      setConvosLoading(false);
    }
  }, [API_BASE]);

  const {
    input,
    setInput,
    history,
    expanded,
    isLoading,
    isDeleting,
    scrollRef,
    pulseAnim,
    toggleReasoning,
    handleSubmit,
    saveConversation,
    openConversation,
    deleteConversation,
  } = useBobee();

  const { conversationId, initialQuestion } = useLocalSearchParams<{
    conversationId?: string;
    initialQuestion?: string;
  }>();

  // On first mount: either open an existing conversation or start a new one
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

  // Fetch conversations when sidebar opens the first time or when returning to page
  useEffect(() => {
    if (showSidebar) {
      fetchConvos();
    }
  }, [showSidebar, fetchConvos]);

  // Also refresh list once on mount (silent) so it is ready when user opens sidebar
  useEffect(() => {
    fetchConvos();
  }, [fetchConvos]);

  // Trigger handleSubmit only after input is set
  useEffect(() => {
    if (pendingInitial && input === pendingInitial) {
      handleSubmit();
      setPendingInitial(null);
    }
  }, [input, pendingInitial, handleSubmit]);

  const { tour } = useLocalSearchParams<{ tour?: string }>();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    setShowTutorial(tour === "5");
  }, [tour]);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 40}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.lightest} />
      <Header title="Conversation" leftIcon="menu" onLeftPress={toggleSidebar} />

      {renderSidebar({
        sidebarAnim,
        convos,
        convosLoading,
        convosError,
        onSelect: (id) => openConversation(id),
        close: () => toggleSidebar(),
        refresh: fetchConvos,
      })}

      <ChatScreen
        history={history}
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

      {showTutorial && (
        <TutorialOverlay
          step={5}
          total={5}
          title="Chat with Bobee"
          description="Ask questions, get coaching, or brainstorm. Bobee learns from your journaling to tailor responses."
          nextLabel="Finish"
          onNext={() => {
            setShowTutorial(false);
          }}
          onSkip={() => setShowTutorial(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

interface SidebarProps {
  sidebarAnim: Animated.Value;
  convos: { id: string; title: string; createdAt: string; updatedAt?: string }[];
  convosLoading: boolean;
  convosError: string | null;
  onSelect: (id: string) => void;
  close: () => void;
  refresh: () => void;
}

function renderSidebar({
  sidebarAnim,
  convos,
  convosLoading,
  convosError,
  onSelect,
  close,
  refresh,
}: SidebarProps) {
  const width = Math.min(Dimensions.get("window").width * 0.75, 320);
  const translateX = sidebarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, 0],
  });

  return (
    <>
      <Animated.View
        style={[styles.sidebarPanel, { width, transform: [{ translateX }] }]}
      >
        <View style={styles.sidebarHeaderRow}>
          <Text style={styles.sidebarTitle}>Your Chats</Text>
          <TouchableOpacity onPress={close}>
            <Text style={styles.sidebarClose}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView refreshControl={undefined}>
          {convosLoading && (
            <View style={styles.sidebarLoadingWrap}>
              <SpinningLoader size={30} thickness={4} />
            </View>
          )}

          {!convosLoading && convosError && (
            <TouchableOpacity onPress={refresh} style={styles.sidebarErrorBox}>
              <Text style={styles.sidebarErrorText}>
                {convosError}. Tap to retry.
              </Text>
            </TouchableOpacity>
          )}

          {!convosLoading && !convosError && convos.length === 0 && (
            <Text style={styles.sidebarEmpty}>No conversations yet.</Text>
          )}

          {!convosLoading &&
            !convosError &&
            convos.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.sidebarItem}
                onPress={() => {
                  onSelect(c.id);
                  close();
                }}
              >
                <Text style={styles.sidebarItemTitle}>
                  {c.title || "Untitled"}
                </Text>
                <Text style={styles.sidebarItemDate}>
                  {new Date(c.updatedAt || c.createdAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </Animated.View>

      <Animated.View
        style={[
          styles.sidebarBackdrop,
          {
            opacity: sidebarAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.4],
            }),
          },
        ]}
        pointerEvents={"auto"}
      >
        <TouchableOpacity style={styles.fill} onPress={close} />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  // Screen
  screen: {
    flex: 1,
    backgroundColor: colors.lightest,
  },

  // Generic helpers
  fill: {
    flex: 1,
  },

  // Sidebar
  sidebarPanel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 16,
    zIndex: 50,
    elevation: 50,
    borderRightWidth: 1,
    borderColor: colors.light,
  },
  sidebarHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    borderBottomColor: colors.lighter,
    borderBottomWidth: 1,
    paddingBottom: 6,
    marginBottom: 16,
  },
  sidebarTitle: {
    fontFamily: "SpaceMonoSemibold",
    fontSize: 18,
    color: colors.darkest,
  },
  sidebarClose: {
    fontSize: 30,
    color: colors.dark,
  },
  sidebarEmpty: {
    fontFamily: "SpaceMono",
    fontSize: 14,
    color: colors.dark,
    opacity: 0.6,
    marginTop: 20,
  },
  sidebarItem: {
    padding: 10,
    backgroundColor: colors.lightest,
    borderRadius: 8,
    marginBottom: 8,
  },
  sidebarItemTitle: {
    fontFamily: "SpaceMono",
    fontSize: 16,
    marginBottom: 5,
    color: colors.darkest,
  },
  sidebarItemDate: {
    fontFamily: "SpaceMonoSemibold",
    fontSize: 12,
    alignSelf: "flex-end",
    color: colors.blue,
    marginTop: 2,
  },
  sidebarBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 40,
  },
  sidebarErrorBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fee",
    borderRadius: 8,
  },
  sidebarErrorText: {
    fontFamily: "SpaceMono",
    fontSize: 13,
    color: "rgb(119,10,10)",
  },
  sidebarLoadingWrap: {
    marginTop: 30,
    alignItems: "center",
  },
});
