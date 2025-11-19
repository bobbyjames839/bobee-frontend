import React from "react";
import {
  View,
  ScrollView,
  Text,
  Animated,
  Image,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "~/constants/Colors";

type ChatHistoryItem = {
  question: string;
  answer?: string;
};

interface ChatMessagesProps {
  history: ChatHistoryItem[];
  scrollRef: React.RefObject<ScrollView | null>;
  pulseAnim: Animated.Value;
  isLoading: boolean;
  footerHeight: number;
  kbHeight: number;
}

export default function ChatMessages({
  history,
  scrollRef,
  pulseAnim,
  isLoading,
  footerHeight,
  kbHeight,
}: ChatMessagesProps) {
  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={[
        styles.container,
        { paddingBottom: footerHeight + kbHeight },
      ]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={false}
      keyboardDismissMode="interactive"
    >
      {history.length === 0 && !isLoading && (
        <View style={styles.emptyWrap}>
          <Image
            source={require("~/assets/images/happy.png")}
            style={styles.emptyImage}
            resizeMode="contain"
          />
          <Text style={styles.emptyTitle}>Start a fresh chat</Text>
          <Text style={styles.emptyText}>
            Ask anything about your day, mood, habits or goals.
          </Text>
        </View>
      )}
      {history.map((item, idx) => (
        <View key={idx} style={styles.bubbleWrapper}>
          <View style={[styles.bubble, styles.userBubble]}>
            <Text style={styles.userText}>{item.question}</Text>
          </View>

          {item.answer ? (
            <View style={[styles.bubble, styles.aiBubble]}>
              {renderStructuredAnswer(item.answer)}
            </View>
          ) : (
            isLoading &&
            idx === history.length - 1 && (
              <Animated.View
                style={[
                  styles.pulseIcon,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <View
                  style={{
                    width: 10,
                    marginLeft: 10,
                    height: 10,
                    borderRadius: 50,   // half of width/height
                    backgroundColor: colors.blue,
                  }}
                />
              </Animated.View>
            )
          )}
        </View>
      ))}
    </ScrollView>
  );
}

// Helper to parse bold text **text** into Text components
function parseBoldText(text: string) {
  const parts: Array<{ text: string; bold: boolean }> = [];
  const regex = /\*(.+?)\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({ text: text.substring(lastIndex, match.index), bold: false });
    }
    // Add the bold text (without the **)
    parts.push({ text: match[1], bold: true });
    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ text: text.substring(lastIndex), bold: false });
  }

  return parts;
}

function renderStructuredAnswer(raw: string) {
  const clean = raw.trim();
  if (!clean) return null;
  const paragraphs = clean
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <View>
      {paragraphs.map((para, i) => {
        const lines = para
          .split(/\n+/)
          .map((l) => l.trim())
          .filter(Boolean);

        // Check for ALL CAPS header (4+ chars, all uppercase)
        const isHeader =
          lines.length === 1 && /^[A-Z\s]{4,}:?$/.test(lines[0]);
        if (isHeader) {
          return (
            <Text
              key={i}
              style={[styles.sectionHeader, i > 0 && styles.paragraphGap]}
            >
              {lines[0]}
            </Text>
          );
        }

        // Check for bullet list (lines starting with optional spaces then • or -)
        const bulletLines = lines.filter((l) => /^\s*[•\-]\s+/.test(l));
        const isBulletBlock =
          bulletLines.length >= 2 && bulletLines.length === lines.length;

        if (isBulletBlock) {
          return (
            <View key={i} style={i > 0 ? styles.paragraphGap : undefined}>
              {lines.map((line, li) => {
                // Extract leading spaces to determine indent level
                const indentMatch = line.match(/^(\s*)[•\-]\s+/);
                const indentSpaces = indentMatch ? indentMatch[1].length : 0;
                const indentLevel = Math.floor(indentSpaces / 2);
                const text = line.replace(/^\s*[•\-]\s+/, "");
                const parts = parseBoldText(text);
                return (
                  <View
                    key={li}
                    style={[
                      styles.bulletRow,
                      { marginLeft: indentLevel * 16 + 8 },
                    ]}
                  >
                    <Text style={styles.bulletSymbol}>•</Text>
                    <Text style={styles.bulletText}>
                      {parts.map((part, pi) => (
                        <Text
                          key={pi}
                          style={part.bold ? styles.boldText : undefined}
                        >
                          {part.text}
                        </Text>
                      ))}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        }

        // Check for numbered list (lines starting with 1., 2., etc.)
        const numberedLines = lines.filter((l) => /^\d+\.\s+/.test(l));
        const isNumberedBlock =
          numberedLines.length >= 2 && numberedLines.length === lines.length;

        if (isNumberedBlock) {
          return (
            <View key={i} style={i > 0 ? styles.paragraphGap : undefined}>
              {lines.map((line, li) => {
                const match = line.match(/^(\d+)\.\s+(.*)/);
                if (!match) return null;
                const number = match[1];
                const text = match[2];
                const parts = parseBoldText(text);
                return (
                  <View key={li} style={styles.numberedRow}>
                    <Text style={styles.numberText}>{number}.</Text>
                    <Text style={styles.numberedText}>
                      {parts.map((part, pi) => (
                        <Text
                          key={pi}
                          style={part.bold ? styles.boldText : undefined}
                        >
                          {part.text}
                        </Text>
                      ))}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        }

        // Check for indented lines (start with 2+ spaces)
        const hasIndentedLines = lines.some((l) => /^\s{2,}/.test(l));
        if (hasIndentedLines) {
          return (
            <View key={i} style={i > 0 ? styles.paragraphGap : undefined}>
              {lines.map((line, li) => {
                const indentMatch = line.match(/^(\s+)/);
                const indentLevel = indentMatch
                  ? Math.floor(indentMatch[1].length / 2)
                  : 0;
                const text = line.trim();
                const parts = parseBoldText(text);
                return (
                  <Text
                    key={li}
                    style={[
                      styles.aiText,
                      indentLevel > 0 && {
                        marginLeft: indentLevel * 16,
                        marginTop: 4,
                      },
                    ]}
                  >
                    {parts.map((part, pi) => (
                      <Text
                        key={pi}
                        style={part.bold ? styles.boldText : undefined}
                      >
                        {part.text}
                      </Text>
                    ))}
                  </Text>
                );
              })}
            </View>
          );
        }

        // Regular paragraph
        const paragraphText = lines.join("\n");
        const parts = parseBoldText(paragraphText);
        return (
          <Text key={i} style={[styles.aiText, i > 0 && styles.paragraphGap]}>
            {parts.map((part, pi) => (
              <Text key={pi} style={part.bold ? styles.boldText : undefined}>
                {part.text}
              </Text>
            ))}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 10 },
  emptyWrap: {
    alignItems: "center",
    marginTop: 150,
    paddingHorizontal: 10,
  },
  emptyImage: {
    width: 120,
    height: 120,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: colors.darkestblue,
  },
  emptyTitle: {
    fontFamily: "SpaceMonoSemibold",
    fontSize: 18,
    color: colors.darkest,
    marginTop: 10,
  },
  emptyText: {
    fontFamily: "SpaceMono",
    fontSize: 14,
    color: colors.dark,
    marginTop: 5,
    textAlign: "center",
    lineHeight: 20,
    width: 270,
  },
  bubbleWrapper: { marginBottom: 8 },
  bubble: { borderRadius: 16, padding: 14, maxWidth: "85%" },
  userBubble: {
    backgroundColor: colors.lightestblue,
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderRadius: 16,
    marginTop: 8,
    maxWidth: "100%",
  },
  userText: {
    color: colors.darkest,
    fontFamily: "SpaceMono",
    fontSize: 15,
    lineHeight: 22,
  },
  aiText: {
    color: colors.darkest,
    fontFamily: "SpaceMono",
    fontSize: 15,
    lineHeight: 22,
  },
  paragraphGap: {
    marginTop: 18,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  bulletSymbol: {
    color: colors.darkest,
    fontFamily: "SpaceMono",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 0,
  },
  bulletText: {
    flex: 1,
    color: colors.darkest,
    fontFamily: "SpaceMono",
    fontSize: 15,
    lineHeight: 22,
  },
  boldText: {
    fontFamily: "SpaceMonoBold",
    fontWeight: "600",
  },
  sectionHeader: {
    color: colors.darkest,
    fontFamily: "SpaceMonoBold",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  numberedRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 4,
  },
  numberText: {
    color: colors.darkest,
    fontFamily: "SpaceMonoBold",
    fontSize: 15,
    lineHeight: 22,
    minWidth: 24,
  },
  numberedText: {
    flex: 1,
    color: colors.darkest,
    fontFamily: "SpaceMono",
    fontSize: 15,
    lineHeight: 22,
  },
  pulseIcon: { alignSelf: "flex-start", marginTop: 8 },
});
