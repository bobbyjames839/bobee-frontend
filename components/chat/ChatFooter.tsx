import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AutoExpandingInput from "../other/AutoExpandingInput";
import { colors } from "~/constants/Colors";
import * as Haptics from 'expo-haptics';

const SUGGESTIONS: Array<{
  title: string;
  description: string;
  text: string;
}> = [
  {
    title: "Write me a summary",
    description: "of how I am feeling right now",
    text: "Hey, can you write me a summary based on how I am feeling at the moment?",
  },
  {
    title: "Plan my evening",
    description: "with some relaxing activities",
    text: "Can you plan my evening with a few relaxing activities to help me unwind?",
  },
  {
    title: "Identify patterns",
    description: "from my recent entries",
    text: "Could you identify any patterns from my recent journal entries?",
  },
  {
    title: "Give me motivation",
    description: "for my goals today",
    text: "Can you give me some motivation to help me achieve my goals today?",
  },
  {
    title: "Check my progress",
    description: "on recent habits",
    text: "Could you check my progress on the habits I have been tracking recently?",
  },
];

interface ChatFooterProps {
  input: string;
  setInput: (s: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
  showSuggestions: boolean;
  buttonsBottomPad: number;
  footerBottomAnim: Animated.Value;
  isTabBarVisible?: boolean;
  hideTabBar?: () => void;
  showTabBar?: () => void;
}

export default function ChatFooter({
  input,
  setInput,
  isLoading,
  onSubmit,
  showSuggestions,
  buttonsBottomPad,
  footerBottomAnim,
  isTabBarVisible,
  hideTabBar,
  showTabBar,
}: ChatFooterProps) {
  return (
    <Animated.View
      style={[
        styles.footer,
        { bottom: footerBottomAnim, paddingBottom: buttonsBottomPad },
      ]}
    >
      {showSuggestions && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsContent}
          style={styles.suggestionsRow}
        >
          {SUGGESTIONS.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              style={[
                styles.suggestionCard,
                index !== SUGGESTIONS.length - 1 && styles.suggestionSpacing,
              ]}
              activeOpacity={0.8}
              onPress={() => setInput(item.text)}
            >
              <Text style={styles.suggestionTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.suggestionDescription} numberOfLines={1}>
                {item.description}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <View style={styles.footerBottomContainer}>
        {hideTabBar && showTabBar && (
          <TouchableOpacity
            onPress={isTabBarVisible ? () => {
              hideTabBar();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            } : () => {
              showTabBar();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            }}
            style={styles.tabBarToggleButton}
          >
            {isTabBarVisible ? (
              <Ionicons name="arrow-down" size={20} color={colors.darkest} />
            ) : (
              <Ionicons name="arrow-up" size={20} color={colors.darkest} />
            )}
          </TouchableOpacity>
        )}
        <View style={styles.footerBottom}>
          <AutoExpandingInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything"
            placeholderTextColor="rgba(107, 107, 107, 1)"
            minHeight={22}
            maxHeight={120}
            style={styles.input}
            editable={!isLoading}
            returnKeyType="send"
            onSubmitEditing={onSubmit}
            blurOnSubmit={false}
            onLineCountChange={() => {}}
          />
          <TouchableOpacity
            onPress={onSubmit}
            disabled={isLoading}
            style={styles.sendButton}
          >
            <Ionicons name="arrow-up" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: colors.lightest,
    paddingTop: 10,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  footerBottomContainer: {
    width: "93%",
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
  },
  footerBottom: {
    flex: 1,
    paddingHorizontal: 5,
    paddingLeft: 16,
    borderRadius: 27,
    paddingVertical: 5,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
    alignItems: "center",
    overflow: "hidden",
  },
  suggestionsRow: {
    maxHeight: 110,
    width: "100%",
  },
  suggestionsContent: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  suggestionCard: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "#fff",
    borderRadius: 18,
    justifyContent: "center",
  },
  suggestionSpacing: {
    marginRight: 10,
  },
  suggestionTitle: {
    fontFamily: "SpaceMonoSemibold",
    fontSize: 15,
    color: colors.darkest,
    marginBottom: 6,
  },
  suggestionDescription: {
    fontFamily: "SpaceMono",
    fontSize: 13,
    color: colors.dark,
    lineHeight: 18,
  },
  input: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 15,
    letterSpacing: 0.3,
    color: colors.darkest,
    lineHeight: 22,
    marginBottom: 7,
  },
  tabBarToggleButton: {
    padding: 12,
    backgroundColor: "white",
    borderRadius: 500,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButton: {
    marginLeft: 3,
    padding: 7,
    backgroundColor: colors.blue,
    borderRadius: 500,
    alignSelf: "flex-end",
  },
});
