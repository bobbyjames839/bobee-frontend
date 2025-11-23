import { router } from 'expo-router';
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Header from '~/components/other/Header';
import { colors } from '~/constants/Colors';

export default function How() {
  return (
    <>
    <Header
        title='How To Use'
        leftIcon="chevron-back"
        onLeftPress={() => (router.back())}/>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.box}>
        <Text style={styles.boxText}>
          <Text style={styles.sectionTitle}>Overview</Text>{"\n"}
          Bobee is your AI-powered journaling companion. Simply speak your thoughts and Bobee will
          transcribe them instantly, generating mood analysis, personality insights, topic
          breakdowns, daily tips, and tailored chatbot responses. The more you use Bobee, the better
          it understands your style and needs.
          {"\n\n"}

          <Text style={styles.sectionTitle}>Quick Start</Text>{"\n"}
          • Tap the microphone icon and start talking — no typing required.{"\n"}
          • Watch Bobee transcribe your words in real time.{"\n"}
          • Instantly receive insights: mood, personality, topics, and tips.{"\n"}
          • Chat with your personal AI assistant for deeper reflections.{"\n"}
          • Visit Insights to track trends and progress over time.
          {"\n\n"}

          <Text style={styles.sectionTitle}>What You Get</Text>{"\n"}
          • Mood analysis{"\n"}
          • Personality metrics{"\n"}
          • Topic breakdowns{"\n"}
          • Daily tips{"\n"}
          • Tailored AI chatbot{"\n"}
          • Trends & streaks
          {"\n\n"}

          <Text style={styles.sectionTitle}>Tips for Best Results</Text>{"\n"}
          • Journal daily — even 60 seconds can make a difference.{"\n"}
          • Be detailed about events, thoughts, and feelings.{"\n"}
          • Ask your AI assistant follow-up questions to dig deeper.{"\n"}
          • Review Insights weekly to spot patterns in your growth.
        </Text>
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightest,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  box: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 20,
    width: '100%',
  },
  sectionTitle: {
    fontFamily: 'SpaceMonoSemibold',
    fontSize: 16,
    color: colors.blue,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  boxText: {
    fontFamily: 'SpaceMono',
    fontSize: 15,
    lineHeight: 24,
    color: colors.darkest,
  },
});
