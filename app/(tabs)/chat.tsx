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
  TextInput,
} from "react-native";
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import useBobee from "~/hooks/useBobee";
import ChatScreen from "~/components/chat/ChatScreen";
import SpinningLoader from "~/components/other/SpinningLoader";
import { colors } from "~/constants/Colors";
import { getAuth } from "firebase/auth";
import Constants from "expo-constants";
import TutorialOverlay from "~/components/other/TutorialOverlay";
import DeleteConfirmModal from "~/components/other/DeleteConfirmModal";
import { navigate } from "expo-router/build/global-state/routing";
import { FilePen, TextAlignStart, ChevronUp } from "lucide-react-native";
import { useTabBar } from "~/context/TabBarContext";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

type PersonalityStyle =
  | "friendly"
  | "direct"
  | "coaching"
  | "analytical"
  | "fun"
  | "supportive";

export default function BobeeChatPage() {
  const [showSidebar, setShowSidebar] = useState(false);
  const { isTabBarVisible, showTabBar, hideTabBar } = useTabBar();
  const sidebarAnim = useState(new Animated.Value(0))[0];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [convos, setConvos] = useState<
    { id: string; title: string; createdAt: string; updatedAt?: string }[]
  >([]);
  const [convosLoading, setConvosLoading] = useState(false);
  const [convosError, setConvosError] = useState<string | null>(null);
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string;

  // Chat behaviour + appearance settings
  const [personalityStyle, setPersonalityStyle] =
    useState<PersonalityStyle>("friendly");
  const [creativityLevel, setCreativityLevel] = useState<number>(50); // 0–100
  const [bubbleColor, setBubbleColor] = useState<string>(colors.blue);

  const toggleSidebar = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
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
      console.log("Fetched conversations:", data);
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
    isLoading,
    scrollRef,
    pulseAnim,
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
    if (showSidebar) {
      fetchConvos();
    }
  }, [showSidebar, fetchConvos]);

  useEffect(() => {
    fetchConvos();
  }, [fetchConvos]);

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

  const handleNewChat = useCallback(() => {
    if (currentConversationId) {
      newConversation();
      return;
    }

    if (history.length === 0) {
      newConversation();
      return;
    }

    const currentHistory = [...history];

    newConversation();

    (async () => {
      try {
        const uid = getAuth().currentUser?.uid;
        if (!uid) return;

        const transcript = currentHistory
          .map(
            (item, i) =>
              `${i + 1}. Q: ${item.question}\n   A: ${
                item.answer ?? "[no answer]"
              }`
          )
          .join("\n");

        const idToken = await getAuth().currentUser!.getIdToken(true);

        await fetch(`${API_BASE}/api/save-conversation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            conversationId: null,
            transcript,
            history: currentHistory,
          }),
        });
      } catch (e) {
        console.warn("Background save failed", e);
      }
    })();
  }, [history, currentConversationId, newConversation, API_BASE]);

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
              onPress={toggleSidebar}
              style={styles.headerButton}
            >
              <TextAlignStart size={22} color={colors.blue} strokeWidth={2} />
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
              <FilePen size={22} color={colors.blue} strokeWidth={2} />
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
            currentConversationId,
            personalityStyle,
            setPersonalityStyle,
            creativityLevel,
            setCreativityLevel,
            bubbleColor,
            setBubbleColor,
          })}

          <ChatScreen
            history={history}
            scrollRef={scrollRef}
            pulseAnim={pulseAnim}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            isTabBarVisible={isTabBarVisible}
          />
        </Animated.View>

        {!isTabBarVisible && (
          <TouchableOpacity
            style={styles.tabBarToggle}
            onPress={showTabBar}
            activeOpacity={0.8}
          >
            <ChevronUp size={23} color={colors.blue} strokeWidth={2.5} />
          </TouchableOpacity>
        )}

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
  currentConversationId: string | null;
  personalityStyle: PersonalityStyle;
  setPersonalityStyle: React.Dispatch<React.SetStateAction<PersonalityStyle>>;
  creativityLevel: number;
  setCreativityLevel: React.Dispatch<React.SetStateAction<number>>;
  bubbleColor: string;
  setBubbleColor: React.Dispatch<React.SetStateAction<string>>;
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
  currentConversationId,
  personalityStyle,
  setPersonalityStyle,
  creativityLevel,
  setCreativityLevel,
}: SidebarProps) {
  const [deleteConfirmId, setDeleteConfirmId] =
    React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const width = Dimensions.get("window").width * 0.8;
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

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredConvos =
    normalizedQuery.length === 0
      ? convos
      : convos.filter((c) =>
          (c.title || "Untitled").toLowerCase().includes(normalizedQuery)
        );

  const renderSettingPill = (
    label: string,
    active: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.settingPill, active && styles.settingPillActive]}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.settingPillText,
          active && styles.settingPillTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <Animated.View
        style={[styles.sidebarPanel, { width, transform: [{ translateX }] }]}
      >
        {/* Search */}
        <View style={styles.sidebarSearchContainer}>
          <Ionicons name="search" size={20} color={colors.dark} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search"
            placeholderTextColor={colors.dark + "88"}
            style={styles.sidebarSearchInput}
            autoCorrect={false}
          />
        </View>

        {/* Content (scrollable chats + fixed settings) */}
        <View style={styles.sidebarContent}>
          <ScrollView
            style={styles.sidebarList}
            contentContainerStyle={styles.sidebarListContent}
            refreshControl={undefined}
          >
            {convosLoading && (
              <View style={styles.sidebarLoadingWrap}>
                <SpinningLoader size={30} thickness={4} />
              </View>
            )}

            {!convosLoading && convosError && (
              <TouchableOpacity
                onPress={refresh}
                style={styles.sidebarErrorBox}
              >
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
              convos.length > 0 &&
              filteredConvos.length === 0 && (
                <Text style={styles.sidebarEmpty}>
                  No matches for your search.
                </Text>
              )}

            {!convosLoading &&
              !convosError &&
              filteredConvos.map((c) => {
                const isActive = c.id === currentConversationId;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.sidebarItem,
                      isActive && styles.sidebarItemActive,
                    ]}
                    onPress={() => {
                      onSelect(c.id);
                      close();
                    }}
                    onLongPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                      setDeleteConfirmId(c.id);
                    }}
                    delayLongPress={1000}
                  >
                    <Text style={styles.sidebarItemTitle}>
                      {c.title || "Untitled"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </ScrollView>

          {/* Fixed settings at bottom */}
          <View style={styles.sidebarSettings}>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsLabel}>Personality style</Text>
              <View style={styles.settingsPillRow}>
                {renderSettingPill(
                  "Friendly",
                  personalityStyle === "friendly",
                  () => setPersonalityStyle("friendly")
                )}
                {renderSettingPill(
                  "Direct",
                  personalityStyle === "direct",
                  () => setPersonalityStyle("direct")
                )}
                {renderSettingPill(
                  "Coaching",
                  personalityStyle === "coaching",
                  () => setPersonalityStyle("coaching")
                )}
              </View>
              <View style={[styles.settingsPillRow, { marginTop: 8 }]}>
                {renderSettingPill(
                  "Analytical",
                  personalityStyle === "analytical",
                  () => setPersonalityStyle("analytical")
                )}
                {renderSettingPill(
                  "Fun",
                  personalityStyle === "fun",
                  () => setPersonalityStyle("fun")
                )}
                {renderSettingPill(
                  "Supportive",
                  personalityStyle === "supportive",
                  () => setPersonalityStyle("supportive")
                )}
              </View>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsLabel}>
                Creativity level ({Math.round(creativityLevel)})
              </Text>
              <Slider
                style={styles.creativitySlider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={creativityLevel}
                onValueChange={setCreativityLevel}
                minimumTrackTintColor={colors.blue}
                maximumTrackTintColor={colors.lighter}
                thumbTintColor={colors.blue}
                
              />
              <View style={styles.creativityTicksRow}>
                <Text style={styles.creativityTickLabel}>0</Text>
                <Text style={styles.creativityTickLabel}>50</Text>
                <Text style={styles.creativityTickLabel}>100</Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      <DeleteConfirmModal
        visible={!!deleteConfirmId}
        title="Delete Conversation?"
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        isDeleting={isDeleting}
      />

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
  screen: {
    flex: 1,
    backgroundColor: colors.lightest,
  },
  fill: {
    flex: 1,
  },
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
  sidebarTitle: {
    fontFamily: "SpaceMonoSemibold",
    fontSize: 18,
    color: colors.darkest,
    marginLeft: 10,
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
  },
  sidebarItemActive: {
    backgroundColor: colors.lightest,
    borderColor: colors.lighter,
    borderWidth: 0,
  },
  sidebarItemTitle: {
    fontFamily: "SpaceMono",
    fontSize: 15,
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
  sidebarSearchContainer: {
    borderWidth: 1,
    borderColor: colors.lighter,
    borderRadius: 28,
    padding: 10,
    marginTop: 10,
    marginBottom: 20,
    gap: 8,
    fontFamily: "SpaceMono",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    fontSize: 14,
    color: colors.darkest,
    backgroundColor: colors.lightest,
  },
  sidebarSearchInput: {
    flex: 1,
    fontSize: 15,
  },
  sidebarContent: {
    flex: 1,
  },
  sidebarList: {
    flex: 1,
  },
  sidebarListContent: {
    paddingBottom: 8,
  },
  sidebarSettings: {
    borderTopWidth: 1,
    borderTopColor: colors.lighter,
    paddingBottom: 38,
    gap: 10,
  },
  settingsSection: {
    marginTop: 4,
  },
  settingsLabel: {
    fontFamily: "SpaceMonoSemibold",
    fontSize: 15,
    color: colors.dark,
    marginBottom: 10,
    marginTop: 15,
  },
  settingsPillRow: {
    flexDirection: "row",
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  settingPill: {
    borderRadius: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.lighter,
    backgroundColor: "#fff",
    width: "32%", 
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  settingPillActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  settingPillText: {
    fontFamily: "SpaceMono",
    fontSize: 13,
    color: colors.darkest,
  },
  settingPillTextActive: {
    color: "#fff",
  },
  creativitySlider: {
    width: "100%",
    height: 22,
  },
  creativityTicksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -2,
  },
  creativityTickLabel: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: colors.dark,
    opacity: 0.7,
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
    backgroundColor: "white",
    borderRadius: 30,
    padding: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.lighter,
  },
  tabBarToggle: {
    position: "absolute",
    bottom: -6,
    left: 50,
    backgroundColor: "white",
    borderRadius: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.lighter,
  },
});
