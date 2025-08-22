import { router } from 'expo-router';
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Header from '~/components/other/Header';
import { colors } from '~/constants/Colors';

export default function Privacy() {
  return (
    <>
    <Header
        title='Privacy Statement'
        leftIcon="chevron-back"
        onLeftPress={() => (router.back())}/>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.box}>
        <Text style={styles.boxTitle}>Bobee Privacy Statement</Text>
        <Text style={styles.boxText}>
          <Text style={styles.sectionTitle}>Last Updated:</Text> 10 August 2025
          {"\n\n"}
          <Text style={styles.sectionTitle}>Overview</Text>{"\n"}
          At Bobee, your privacy is a priority. This statement explains the information we collect, how we use it, and the steps we take to protect it.
          {"\n\n"}
          <Text style={styles.sectionTitle}>Information We Collect</Text>{"\n"}
          We store transcriptions of your spoken journal entries — audio recordings are not saved — along with AI-generated insights such as mood analysis, personality metrics, topic breakdowns, daily tips, and progress data like trends and streaks. We do not collect unrelated usage or background activity data.
          {"\n\n"}
          <Text style={styles.sectionTitle}>How We Use Your Information</Text>{"\n"}
          Your information is used to provide accurate and meaningful insights from your journals, help you track progress over time, and enhance the model prompts that power your personal AI chatbot. Aggregated and anonymized data may also be used to improve our AI systems.
          {"\n\n"}
          <Text style={styles.sectionTitle}>Data Storage & Security</Text>{"\n"}
          All data is stored securely in Firebase and protected with its default encryption both in transit and at rest. Insights are generated in real time during journaling sessions and may also be drawn from your stored entries. API calls to OpenAI are used to process your transcriptions; to the best of our knowledge, OpenAI does not retain the content of these calls.
          {"\n\n"}
          <Text style={styles.sectionTitle}>Third-Party Services</Text>{"\n"}
          We use Firebase for authentication and data storage, and OpenAI for AI processing. We do not sell your personal information, and any sharing is limited to anonymized data for the sole purpose of improving AI functionality.
          {"\n\n"}
          <Text style={styles.sectionTitle}>Your Rights</Text>{"\n"}
          You can request a copy of your stored data at any time by contacting us at contact@bobee.co.uk. You may also delete your account and associated data. Data is retained until such a request or action is made.
          {"\n\n"}
          <Text style={styles.sectionTitle}>Cookies & Tracking</Text>{"\n"}
          The Bobee mobile app does not use cookies or tracking technologies. Our website may use basic analytics tools for performance and security monitoring.
          {"\n\n"}
          <Text style={styles.sectionTitle}>Policy Updates</Text>{"\n"}
          We may update this statement periodically to reflect changes in our practices. Any updates will be posted in the app with the date of the latest revision.
          {"\n\n"}
          <Text style={styles.sectionTitle}>Contact Us</Text>{"\n"}
          For privacy-related questions or requests, please email us at contact@bobee.co.uk.
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
    borderWidth: 1,
    borderColor: colors.lighter,
    borderRadius: 10,
    padding: 20,
    width: '100%',
  },
  boxTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 22,
    paddingBottom: 6,
    borderBottomColor: colors.lighter,
    borderBottomWidth: 1,
    color: colors.darkest,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'SpaceMono',
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
