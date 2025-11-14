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
  Dimensions,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import useBobee from "~/hooks/useBobee";
import ChatScreen from "~/components/bobee/ChatScreen";
import SpinningLoader from "~/components/other/SpinningLoader";
import { colors } from "~/constants/Colors";
import { getAuth } from "firebase/auth";
import Constants from "expo-constants";
import TutorialOverlay from "~/components/other/TutorialOverlay";
import { navigate } from "expo-router/build/global-state/routing";
import { ChevronLeft, FilePen } from "lucide-react-native";
import { TextAlignStart } from "lucide-react-native";




export default function BobeeChatPage() {
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
    newConversation,
    conversationId: currentConversationId,
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

  const handleBackWithSave = useCallback(() => {
    // Navigate back immediately, then save in the background
    router.back();
    
    // Save in the background without blocking UI
    saveConversation().catch((e) => {
      console.warn("saveConversation failed", e);
    });
  }, [saveConversation]);

  const handleNewChat = useCallback(() => {
    // If conversation already has an ID, it's already saved - just clear and start new
    if (currentConversationId) {
      newConversation();
      return;
    }

    // Don't save if history is empty
    if (history.length === 0) {
      newConversation();
      return;
    }
    
    // Capture current history before clearing
    const currentHistory = [...history];
    
    // Clear conversation immediately for instant UI response
    newConversation();
    
    // Save previous conversation in the background (only unsaved conversations)
    (async () => {
      try {
        const uid = getAuth().currentUser?.uid;
        if (!uid) return;
        
        const transcript = currentHistory
          .map((item, i) => `${i + 1}. Q: ${item.question}\n   A: ${item.answer ?? '[no answer]'}`)
          .join('\n');
        
        const idToken = await getAuth().currentUser!.getIdToken(true);
        
        await fetch(`${API_BASE}/api/save-conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ conversationId: null, transcript, history: currentHistory }),
        });
      } catch (e) {
        console.warn("Background save failed", e);
      }
    })();
  }, [history, currentConversationId, newConversation, API_BASE]);

  return (
    <>
      <Stack.Screen
        options={{
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 40}
      >
        <StatusBar barStyle="dark-content" backgroundColor={colors.lightest} />
        
        <View style={styles.customHeader}>
          <View style={styles.leftIconsGroup}>
            <TouchableOpacity onPress={handleBackWithSave}>
              <ChevronLeft size={24} color={colors.blue} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleSidebar}>
              <TextAlignStart size={24} color={colors.blue} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={handleNewChat} style={styles.rightIconButton}>
            <FilePen size={24} color={colors.blue} strokeWidth={2} />
          </TouchableOpacity>
        </View>

      {renderSidebar({
        sidebarAnim,
        convos,
        convosLoading,
        convosError,
        onSelect: (id) => openConversation(id),
        close: () => toggleSidebar(),
        refresh: fetchConvos,
        onDelete: async (id) => {
          await deleteConversation(id);
          await fetchConvos();
        },
      })}

      <ChatScreen
        history={history}
        scrollRef={scrollRef}
        pulseAnim={pulseAnim}
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        onDirectSubmit={(text) => {
          setInput(text);
          setTimeout(() => handleSubmit(), 50);
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
            navigate('/journal');
          }}
          onSkip={() => setShowTutorial(false)}
        />
      )}
      </KeyboardAvoidingView>
    </>
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
  onDelete: (id: string) => Promise<void>;
}

function renderSidebar({
  sidebarAnim,
  convos,
  convosLoading,
  convosError,
  onSelect,
  close,
  refresh,
  onDelete,
}: SidebarProps) {
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  
  const width = Dimensions.get("window").width * 0.80;
  const translateX = sidebarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, 0],
  });

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await onDelete(id);
      setDeleteConfirmId(null);
    } catch (e) {
      console.warn("Delete failed", e);
    } finally {
      setIsDeleting(false);
    }
  };

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
                onLongPress={() => setDeleteConfirmId(c.id)}
                delayLongPress={1000}
              >
                <Text style={styles.sidebarItemTitle}>
                  {c.title || "Untitled"}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </Animated.View>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteModalTitle}>Delete Conversation?</Text>
            <Text style={styles.deleteModalText}>
              This action cannot be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteModalCancel]}
                onPress={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteModalConfirm]}
                onPress={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <SpinningLoader size={16} thickness={3} color="#fff" />
                ) : (
                  <Text style={styles.deleteModalConfirmText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

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
  borderRadius: 8,
  marginBottom: 8,
  borderWidth: 1,
  borderColor: colors.lightest,
},

  sidebarItemTitle: {
    fontFamily: "SpaceMono",
    fontSize: 16,
    color: colors.darkest,
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
  deleteModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  deleteModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    maxWidth: 320,
  },
  deleteModalTitle: {
    fontFamily: "SpaceMonoSemibold",
    fontSize: 18,
    color: colors.darkest,
    marginBottom: 12,
  },
  deleteModalText: {
    fontFamily: "SpaceMono",
    fontSize: 14,
    color: colors.dark,
    marginBottom: 20,
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteModalCancel: {
    backgroundColor: colors.lighter,
  },
  deleteModalConfirm: {
    backgroundColor: "rgba(233, 127, 127, 1)",
  },
  deleteModalCancelText: {
    fontFamily: "SpaceMono",
    fontSize: 14,
    color: colors.darkest,
  },
  deleteModalConfirmText: {
    fontFamily: "SpaceMono",
    fontSize: 14,
    color: "#fff",
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 10,
    paddingRight: 20,
    paddingTop: 60,
    paddingBottom: 10,
    backgroundColor: colors.lightest,
  },
  leftIconsGroup: {
    backgroundColor: "white",
    display: 'flex',
    flexDirection: "row",
    borderRadius: 30,
    padding: 8,
    paddingLeft: 7,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: colors.lighter,
    gap: 16,
  },
  rightIconButton: {
    backgroundColor: "white",
    borderRadius: 30,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.lighter,
  },
});
