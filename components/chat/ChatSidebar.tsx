import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  TextInput,
  StyleSheet,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import SpinningLoader from "~/components/other/SpinningLoader";
import DeleteConfirmModal from "~/components/other/DeleteConfirmModal";
import { colors } from "~/constants/Colors";

interface ChatSidebarProps {
  sidebarAnim: Animated.Value;
  convos: { id: string; title: string; createdAt: string; updatedAt?: string }[];
  convosLoading: boolean;
  convosError: string | null;
  onSelect: (id: string) => void;
  close: () => void;
  onDelete: (id: string) => Promise<void>;
  currentConversationId: string | null;
  aiPersonality: { style: string; creativity: number } | null;
  updateAiPersonality: (personality: { style: string; creativity: number }) => Promise<void>;
}

export default function ChatSidebar({
  sidebarAnim,
  convos,
  convosLoading,
  convosError,
  onSelect,
  close,
  onDelete,
  currentConversationId,
  aiPersonality,
  updateAiPersonality,
}: ChatSidebarProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
                  aiPersonality?.style === "friendly",
                  () => updateAiPersonality({ style: "friendly", creativity: aiPersonality?.creativity ?? 50 })
                )}
                {renderSettingPill(
                  "Direct",
                  aiPersonality?.style === "direct",
                  () => updateAiPersonality({ style: "direct", creativity: aiPersonality?.creativity ?? 50 })
                )}
                {renderSettingPill(
                  "Coaching",
                  aiPersonality?.style === "coaching",
                  () => updateAiPersonality({ style: "coaching", creativity: aiPersonality?.creativity ?? 50 })
                )}
              </View>
              <View style={[styles.settingsPillRow, { marginTop: 8 }]}>
                {renderSettingPill(
                  "Analytical",
                  aiPersonality?.style === "analytical",
                  () => updateAiPersonality({ style: "analytical", creativity: aiPersonality?.creativity ?? 50 })
                )}
                {renderSettingPill(
                  "Fun",
                  aiPersonality?.style === "fun",
                  () => updateAiPersonality({ style: "fun", creativity: aiPersonality?.creativity ?? 50 })
                )}
                {renderSettingPill(
                  "Supportive",
                  aiPersonality?.style === "supportive",
                  () => updateAiPersonality({ style: "supportive", creativity: aiPersonality?.creativity ?? 50 })
                )}
              </View>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsLabel}>
                Creativity level ({Math.round(aiPersonality?.creativity ?? 50)})
              </Text>
              <Slider
                style={styles.creativitySlider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={aiPersonality?.creativity ?? 50}
                onSlidingComplete={(value) => updateAiPersonality({ style: aiPersonality?.style ?? 'friendly', creativity: value })}
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
    paddingVertical: 8,
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
});
